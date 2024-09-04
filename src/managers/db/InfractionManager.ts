import { Infractions as DatabaseInfraction, Guilds as DatabaseGuild, InfractionType, Prisma } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Colors, EmbedBuilder, Guild, GuildMember, Message, time, User } from 'discord.js';

import { capitalize, hierarchyCheck, userMentionWithId } from '../../utils';

export default class InfractionManager {
  public static async storeInfraction(data: Prisma.InfractionsCreateArgs['data']): Promise<DatabaseInfraction> {
    return await container.db.infractions.create({
      data
    });
  }

  public static async getInfraction(data: Prisma.InfractionsFindUniqueArgs): Promise<DatabaseInfraction | null> {
    return await container.db.infractions.findUnique({
      where: data.where,
      include: data.include
    });
  }

  public static async deleteInfraction(
    where: Prisma.InfractionsDeleteArgs['where']
  ): Promise<DatabaseInfraction | null> {
    return await container.db.infractions.delete({
      where
    });
  }

  public static async deleteAllInfractions(where: Prisma.InfractionsDeleteArgs['where']): Promise<number> {
    const { count } = await container.db.infractions.deleteMany({
      where
    });

    return count;
  }

  public static async resolvePunishment(data: {
    guild: Guild;
    executor: GuildMember;
    target: GuildMember | User;
    punishment: Exclude<InfractionType, 'Warn'>;
    duration: number | null;
    reason: string;
  }) {
    const { guild, executor, target, punishment, duration, reason } = data;

    switch (punishment) {
      case 'Mute':
        return await (target as GuildMember).timeout(
          duration!,
          InfractionManager.formatAuditLogReason(executor, punishment, reason)
        );

      case 'Kick':
        return await guild.members.kick(
          target.id,
          InfractionManager.formatAuditLogReason(executor, punishment, reason)
        );

      case 'Ban':
        return await guild.members.ban(target.id, {
          reason: InfractionManager.formatAuditLogReason(executor, punishment, reason)
        });

      case 'Unban':
        return await guild.members.unban(
          target.id,
          InfractionManager.formatAuditLogReason(executor, punishment, reason)
        );

      case 'Unmute':
        return await (target as GuildMember).timeout(
          null,
          InfractionManager.formatAuditLogReason(executor, punishment, reason)
        );
    }
  }

  public static async validateAction(data: {
    guild: Guild;
    client: GuildMember;
    target: GuildMember | User;
    executor: GuildMember;
    punishment: InfractionType;
  }): Promise<string | null> {
    const { target, executor, punishment, guild, client } = data;
    const lPunishment = punishment.toLowerCase();

    if (executor === target) return `You cannot ${lPunishment} yourself.`;
    if (target === client) return `You cannot ${lPunishment} me.`;

    if (target.id === guild.ownerId) return `You cannot ${lPunishment} the server owner.`;
    if (punishment === InfractionType.Unban && !(await guild.bans.fetch(target.id).catch(() => null)))
      return `You cannot ${lPunishment} someone who is not banned.`;

    if (target instanceof GuildMember) {
      if (!hierarchyCheck(executor, target))
        return `You cannot ${lPunishment} someone with higher or equal roles than you.`;

      if (punishment !== InfractionType.Warn && !hierarchyCheck(client, target))
        return `I cannot ${lPunishment} someone with higher or equal roles than me.`;

      if (punishment === InfractionType.Unmute && !target.isCommunicationDisabled())
        return `You cannot ${lPunishment} someone who is not muted.`;

      if (target.permissions.has('Administrator')) return `You cannot ${lPunishment} an administrator.`;
    }

    return null;
  }

  private static formatAuditLogReason(
    executor: GuildMember,
    punishment: Exclude<InfractionType, 'Warn'>,
    reason: string
  ): string {
    return `[${capitalize(PAST_TENSE_INFRACTIONS[punishment.toLowerCase() as keyof typeof PAST_TENSE_INFRACTIONS])} by ${
      executor.user.username
    } (${executor.id})] ${reason}`;
  }

  public static async sendNotificationDM(data: {
    guild: Guild;
    target: GuildMember;
    infraction: DatabaseInfraction;
  }): Promise<Message | unknown> {
    const { guild, target, infraction } = data;

    const notificationEmbed = new EmbedBuilder()
      .setAuthor({ name: guild.name, iconURL: guild.iconURL()! })
      .setColor(INFRACTION_COLORS[infraction.type])
      .setTitle(
        `You've been ${InfractionManager.formatPastTenseInfraction(infraction.type)} ${InfractionManager.getPreposition(
          infraction.type
        )} ${guild.name}`
      )
      .setFields([
        { name: 'Reason', value: infraction.reason },
        { name: 'Expiration', value: InfractionManager.formatExpiration(infraction.expiresAt) }
      ])
      .setFooter({ text: `Infraction ID: ${infraction.id}` });

    return target.send({ embeds: [notificationEmbed] }).catch(() => {});
  }

  public static async sendInfractionLog(data: {
    message: Message<true>;
    config: DatabaseGuild;
    infraction: DatabaseInfraction;
  }): Promise<Message | unknown> {
    const { message, config, infraction } = data;

    if (!config.infractionLogsChannelId || !config.infractionLogsEnabled) return;

    const channel = await message.guild.channels.fetch(config.infractionLogsChannelId);
    if (!channel || !channel.isTextBased()) return;

    const logEmbed = new EmbedBuilder()
      .setAuthor({ name: `@${message.author.username} (${message.author.id) - ${infraction.type} #${infraction.id}`, iconURL: message.author.displayAvatarURL() })
      .setColor(INFRACTION_COLORS[infraction.type])
      .setFields([
        { name: 'Target', value: userMentionWithId(infraction.userId) },
        { name: 'Reason', value: infraction.reason }
      ])
      .setTimestamp(Number(infraction.createdAt));

    if (infraction.expiresAt)
      logEmbed.spliceFields(1, 0, {
        name: 'Expiration',
        value: InfractionManager.formatExpiration(infraction.expiresAt)
      });

    return channel.send({ embeds: [logEmbed] }).catch(() => {});
  }

  public static formatExpiration(expiration: bigint | number | null): string {
    return expiration === null
      ? 'Never'
      : `${time(Math.floor(Number(expiration) / 1000))} (${time(Math.floor(Number(expiration) / 1000), 'R')})`;
  }

  private static getPreposition(type: InfractionType): string {
    return ['Ban', 'Kick', 'Unban'].includes(type) ? 'from' : 'in';
  }

  private static formatPastTenseInfraction(type: InfractionType): string {
    return PAST_TENSE_INFRACTIONS[type.toLowerCase() as keyof typeof PAST_TENSE_INFRACTIONS];
  }
}

export const PAST_TENSE_INFRACTIONS = {
  ban: 'banned',
  kick: 'kicked',
  mute: 'muted',
  warn: 'warned',
  unban: 'unbanned',
  unmute: 'unmuted'
};

export const INFRACTION_COLORS = {
  Warn: Colors.Yellow,
  Mute: 0xef975c,
  Kick: Colors.Orange,
  Ban: Colors.Red,
  Unmute: Colors.Green,
  Unban: Colors.Green
};

export const REASON_PLACEHOLDER = 'No reason provided.';
export const REASON_MAX_LENGTH = 1000;
