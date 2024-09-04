import { ApplyOptions } from '@sapphire/decorators';
import { send, reply } from '@sapphire/plugin-editable-commands';

import { CharmieCommand, CommandCategory } from '../managers/commands/Command';
import InfractionManager, {
  INFRACTION_COLORS,
  REASON_MAX_LENGTH,
  REASON_PLACEHOLDER
} from '../managers/db/InfractionManager';

@ApplyOptions<CharmieCommand.Options>({
  aliases: ['w', 'strike'],
  category: CommandCategory.Moderation,
  description: 'Issue a warning to a member.',
  usage: '<target> [duration] [reason]',
  requiredUserPermissions: 'ModerateMembers'
})
export default class Warn extends CharmieCommand {
  public async messageRun(
    message: CharmieCommand.Message<true>,
    args: CharmieCommand.Args,
    context: CharmieCommand.GuildRunContext
  ) {
    const { config } = context;

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

    const reason = await args.rest('string').catch(() => REASON_PLACEHOLDER);
    if (reason === REASON_PLACEHOLDER && config.requireInfractionReason)
      throw `You must provide a reason for this warning.`;
    if (reason.length > REASON_MAX_LENGTH)
      throw `The reason cannot exceed ${REASON_MAX_LENGTH} characters (provided ${reason.length}).`;

    if (config.msgCmdsAutoDelete) message.delete().catch(() => {});

    const infraction = await InfractionManager.storeInfraction({
      guildId: message.guildId,
      userId: target.id,
      moderatorId: message.member!.id,
      createdAt: currentDate,
      expiresAt: expiration,
      type: 'Warn',
      reason
    });

    InfractionManager.sendNotificationDM({ guild: message.guild, target, infraction });

    return Promise.all([
      reply(message, {
        embeds: [
          {
            description: `${target.toString()} has been **warned** with ID \`#${infraction.id}\``,
            color: INFRACTION_COLORS.Warn
          }
        ]
      }),
      InfractionManager.sendInfractionLog({ message, config, infraction })
    ]);
  }
}
