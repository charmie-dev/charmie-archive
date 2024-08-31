import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder } from 'discord.js';

import { CharmieCommand, CommandCategory } from '../managers/commands/Command';
import InfractionManager, { INFRACTION_COLORS } from '../managers/db/InfractionManager';

@ApplyOptions<CharmieCommand.Options>({
  aliases: ['w', 'strike'],
  category: CommandCategory.Moderation,
  description: 'Issue a warning to a member.',
  usage: '<user> [duration] [reason]',
  requiredUserPermissions: 'ModerateMembers'
})
export default class Warn extends CharmieCommand {
  public async messageRun(
    message: CharmieCommand.Message<true>,
    args: CharmieCommand.Args,
    context: CharmieCommand.GuildRunContext
  ) {
    const { database_guild: config } = context;

    if (args.finished) throw 'You must provide a member to warn.';

    const target = await args.pick('member').catch(() => {
      throw 'That is not a valid member.';
    });

    const executor = message.member!;

    const validationError = await InfractionManager.validateAction({
      guild: message.guild,
      client: message.guild.members.me!,
      target,
      executor,
      punishment: 'Warn'
    });

    if (validationError) throw validationError;

    let expiration: number | null;

    const duration = await args.pick('duration').catch(() => null);
    const currentDate = Date.now();

    if (duration === 'permanent') expiration = null;
    else expiration = duration ? currentDate + (duration as number) : null;

    if (expiration === null && duration !== 'permanent' && config.defaultWarningDuration !== 0n)
      expiration = Number(config.defaultWarningDuration) + currentDate;

    const reason = await args.rest('string').catch(() => 'Unspecified.');
    if (reason === 'Unspecified.' && config.requireInfractionReason)
      throw `You must provide a reason for this warning.`;
    if (reason.length > 1000) throw `The reason cannot exceed 1000 characters (${reason.length} provided).`;

    if (config.msgCmdsAutoDelete) await message.delete().catch(() => {});

    const infraction = await InfractionManager.storeInfraction({
      guildId: message.guildId,
      userId: target.id,
      moderatorId: message.member!.id,
      createdAt: currentDate,
      expiresAt: expiration,
      type: 'Warn',
      reason
    });

    const notificationEmbed = new EmbedBuilder()
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL()! })
      .setColor(INFRACTION_COLORS.Warn)
      .setTitle(`You've been warned in ${message.guild.name}`)
      .setFields([
        { name: 'Reason', value: reason, inline: true },
        { name: 'Expiration', value: InfractionManager.formatExpiration(expiration), inline: true }
      ])
      .setFooter({ text: `Infraction ID: ${infraction.id}` });

    await target.send({ embeds: [notificationEmbed] }).catch(() => {});

    return send(message, {
      embeds: [
        {
          description: `Warning \`#${infraction.id}\` issued for ${target.toString()} (\`${target.id}\`)`,
          color: INFRACTION_COLORS.Warn
        }
      ]
    });
  }
}
