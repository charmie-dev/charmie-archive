import { ApplyOptions } from '@sapphire/decorators';
import { CharmieCommand, CommandCategory } from '../lib/charmie/Command';
import { EmbedBuilder, EmbedField, GuildMember, Snowflake, time, TimestampStyles, User } from 'discord.js';
import { InfractionType } from '@prisma/client';
import { DEFAULT_EMBED_COLOR } from '../lib/utils/constants';
import { reply } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CharmieCommand.Options>({
  ctx: CommandCategory.Utility,
  usage: '[user]',
  description: 'Get information about a user.',
  aliases: ['ui', 'whois']
})
export default class Userinfo extends CharmieCommand {
  public async messageRun(
    message: CharmieCommand.Message<true>,
    args: CharmieCommand.Args
  ): Promise<CharmieCommand.Message> {
    const user = args.finished
      ? message.member!
      : (await args.pick('member').catch(() => null)) || (await args.pick('user').catch(() => null));
    if (!user) throw 'Invalid user.';

    const embed = new EmbedBuilder()
      .setAuthor({
        name: user instanceof GuildMember ? user.user.username : user.username,
        iconURL: user.displayAvatarURL()
      })
      .setColor(DEFAULT_EMBED_COLOR)
      .setFields(this._formatFields(user))
      .setFooter({ text: `User ID: ${user.id}` });

    await this._getReceivedInfractions(embed, user.id, message.guildId);

    return reply(message, { embeds: [embed] });
  }

  /**
   * Appends an infraction count field to the passed embed.
   *
   * @param embed - The embed to append the field to
   * @param userId - ID of the user to count infractions for
   * @param guildId - The source guild's ID
   */
  private async _getReceivedInfractions(embed: EmbedBuilder, userId: Snowflake, guildId: Snowflake): Promise<void> {
    const [infractions] = await this.container.db.$queryRaw<[InfractionCount]>`
    SELECT SUM(CASE WHEN type::text = ${InfractionType.Ban} THEN 1 ELSE 0 END)::int as bans,
           SUM(CASE WHEN type::text = ${InfractionType.Kick} THEN 1 ELSE 0 END)::int as kicks,
           SUM(CASE WHEN type::text = ${InfractionType.Mute} THEN 1 ELSE 0 END)::int as mutes,
           SUM(CASE WHEN type::text = ${InfractionType.Warn} THEN 1 ELSE 0 END)::int as warns,
           SUM(CASE WHEN type::text = ${InfractionType.Unmute} THEN 1 ELSE 0 END)::int as unmutes,
           SUM(CASE WHEN type::text = ${InfractionType.Unban} THEN 1 ELSE 0 END)::int as unbans
    FROM "Infractions"
    WHERE "userId" = ${userId}
      AND "guildId" = ${guildId}
`;

    embed.addFields({
      name: 'Infractions Received',
      inline: embed.data.fields!.length >= 3,
      value:
        `Warnings: \`${infractions.warns ?? 0}\`\n` +
        `Mutes: \`${infractions.mutes ?? 0}\`\n` +
        `Kicks: \`${infractions.kicks ?? 0}\`\n` +
        `Bans: \`${infractions.bans ?? 0}\`\n` +
        `Unmutes: \`${infractions.unmutes ?? 0}\`\n` +
        `Unbans: \`${infractions.unbans ?? 0}\``
    });
  }

  /**
   * Format the fields for the embed
   */

  private _formatFields(user: User | GuildMember): EmbedField[] {
    const fields: EmbedField[] = [];

    fields.push({
      name: 'Created',
      value: time(user instanceof GuildMember ? user.user.createdAt : user.createdAt, TimestampStyles.RelativeTime),
      inline: true
    });

    if (user instanceof GuildMember && user.joinedAt)
      fields.push({
        name: 'Joined',
        value: time(user.joinedAt, TimestampStyles.RelativeTime),
        inline: true
      });

    fields.push({ name: 'Avatar', value: `[View Here](${user.displayAvatarURL()})`, inline: true });

    return fields;
  }
}

export interface InfractionCount {
  warns: bigint | null;
  mutes: bigint | null;
  kicks: bigint | null;
  bans: bigint | null;
  unmutes: bigint | null;
  unbans: bigint | null;
}