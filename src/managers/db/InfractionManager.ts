import { Infractions as DatabaseInfraction, InfractionType, Prisma } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Colors, Guild, GuildMember, time, User } from 'discord.js';

import { capitalize, hierarchyCheck } from '../../utils';

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

  public static async deleteInfraction(where: Prisma.InfractionsDeleteArgs['where']): Promise<number> {
    const { count } = await container.db.infractions.deleteMany({
      where
    });

    return count;
  }

  public static async resolvePunishment(data: {
    guild: Guild;
    moderator: User;
    target: GuildMember | User;
    punishment: Exclude<InfractionType, 'Warn'>;
    duration: number | null;
    reason: string;
  }) {
    const { guild, moderator, target, punishment, duration, reason } = data;

    switch (punishment) {
      case 'Mute':
        return await (target as GuildMember)
          .timeout(duration!, InfractionManager.formatAuditLogReason(moderator, punishment, reason))
          .catch(() => {});

      case 'Kick':
        return await guild.members
          .kick(target.id, InfractionManager.formatAuditLogReason(moderator, punishment, reason))
          .catch(() => {});

      case 'Ban':
        return await guild.members
          .ban(target.id, {
            reason: InfractionManager.formatAuditLogReason(moderator, punishment, reason)
          })
          .catch(() => {});

      case 'Unban':
        return await guild.members
          .unban(target.id, InfractionManager.formatAuditLogReason(moderator, punishment, reason))
          .catch(() => {});

      case 'Unmute':
        return await (target as GuildMember)
          .timeout(null, InfractionManager.formatAuditLogReason(moderator, punishment, reason))
          .catch(() => {});
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
    moderator: User,
    punishment: Exclude<InfractionType, 'Warn'>,
    reason: string
  ): string {
    return `[${capitalize(punishment.toLowerCase() as keyof typeof PAST_TENSE_INFRACTIONS)} by ${moderator.username} (${
      moderator.id
    })] ${reason}`;
  }

  public static formatExpiration(expiration: number | null): string {
    return expiration === null
      ? 'Never'
      : `${time(Math.floor(expiration / 1000))} (${time(Math.floor(expiration / 1000), 'R')})`;
  }
}

export const PAST_TENSE_INFRACTIONS = {
  ban: 'banned',
  kick: 'kicked',
  timeout: 'muted',
  warn: 'warned',
  unban: 'unbanned',
  untimeout: 'unmuted'
};

export const INFRACTION_COLORS = {
  Warn: Colors.Yellow,
  Mute: 0xef975c,
  Kick: Colors.Orange,
  Ban: Colors.Red,
  Unmute: Colors.Green,
  Unban: Colors.Green
};
