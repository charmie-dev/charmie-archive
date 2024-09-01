import { ApplyOptions } from '@sapphire/decorators';
import { CharmieCommand, CommandCategory } from '../managers/commands/Command';
import InfractionManager, {
  INFRACTION_COLORS,
  REASON_MAX_LENGTH,
  REASON_PLACEHOLDER
} from '../managers/db/InfractionManager';
import ms from 'ms';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CharmieCommand.Options>({
  category: CommandCategory.Moderation,
  description: 'Temporarily silence a member.',
  aliases: ['m', 'shut', 'silence', 'timeout', 'shush'],
  usage: '<target> [duration] [reason]',
  requiredUserPermissions: 'ModerateMembers',
  requiredClientPermissions: 'ModerateMembers'
})
export default class Mute extends CharmieCommand {
  public async messageRun(
    message: CharmieCommand.Message<true>,
    args: CharmieCommand.Args,
    context: CharmieCommand.GuildRunContext
  ) {
    const { config } = context;

    if (args.finished) throw 'You must provide a member to mute.';
    const target = await args.pick('member').catch(() => {
      throw 'That is not a valid member.';
    });

    const executor = message.member!;

    const validationError = await InfractionManager.validateAction({
      guild: message.guild,
      client: message.guild.members.me!,
      target,
      executor,
      punishment: 'Mute'
    });

    if (validationError) throw validationError;

    const duration = await args.pick('duration').catch(() => null);
    const currentDate = Date.now();

    if (duration === 'permanent') throw 'The mute duration cannot be permanent.';
    if (!duration && config.defaultMuteDuration === 0n)
      throw 'You must provide a duration for the mute as a default mute duration is not set.';

    if (duration) {
      if ((duration as number) < 1000) throw 'The mute duration must be at least 1 second.';
      if ((duration as number) > ms('28d')) throw 'The mute duration must not be longer than 28 days.';
    }

    let expiration = duration ? currentDate + (duration as number) : currentDate + Number(config.defaultMuteDuration);

    const reason = await args.rest('string').catch(() => REASON_PLACEHOLDER);
    if (reason === REASON_PLACEHOLDER && config.requireInfractionReason)
      throw `You must provide a reason for this mute.`;
    if (reason.length > REASON_MAX_LENGTH)
      throw `The reason cannot exceed 1000 characters (${reason.length}/${REASON_MAX_LENGTH}).`;

    if (config.msgCmdsAutoDelete) await message.delete().catch(() => {});

    const infraction = await InfractionManager.storeInfraction({
      guildId: message.guildId,
      userId: target.id,
      moderatorId: executor.id,
      type: 'Mute',
      createdAt: currentDate,
      expiresAt: expiration,
      reason
    });

    await InfractionManager.resolvePunishment({
      guild: message.guild,
      target,
      executor,
      punishment: 'Mute',
      duration: duration ? (duration as number) : Number(config.defaultMuteDuration),
      reason
    }).catch(async () => {
      await InfractionManager.deleteInfraction({ id: infraction.id });
      throw 'An error occurred while attempting to mute the target. As a result, the related infraction has been deleted.';
    });

    InfractionManager.sendNotificationDM({ guild: message.guild, target, infraction });

    return Promise.all([
      send(message, {
        embeds: [
          {
            description: `${target.toString()} has been **muted** with ID \`${infraction.id}\``,
            color: INFRACTION_COLORS.Mute
          }
        ]
      }),
      InfractionManager.sendInfractionLog({ message, config, infraction })
    ]);
  }
}
