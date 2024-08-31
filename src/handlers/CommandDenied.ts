import { ApplyOptions } from '@sapphire/decorators';
import { Events, Identifiers, Listener, MessageCommandDeniedPayload, UserError } from '@sapphire/framework';

import { PRECONDITION_IDENTIFIERS } from '../utils/constants';

import MessageCommandError from './CommandError';
import GuildCache from '../managers/db/GuildCache';

@ApplyOptions<Listener.Options>({ event: Events.MessageCommandDenied })
export default class MessageCommandDenied extends Listener<typeof Events.MessageCommandDenied> {
  public async run({ message: eMsg, identifier }: UserError, { message }: MessageCommandDeniedPayload) {
    if (identifier === PRECONDITION_IDENTIFIERS.Silent || identifier === Identifiers.PreconditionGuildOnly) return;

    let respond = true;
    let preserve = false;

    if (message.inGuild()) {
      const {
        msgCmdsPreserveErrors,
        msgCmdsErrorDeleteDelay,
        msgCmdsRespondIfDisabled,
        msgCmdsRespondIfNoPerms,
        msgCmdsRespondIfNotAllowed
      } = await GuildCache.get(message.guildId);

      respond =
        identifier === PRECONDITION_IDENTIFIERS.CommandDisabled
          ? msgCmdsRespondIfDisabled
          : identifier === PRECONDITION_IDENTIFIERS.CommandDisabledInChannel
          ? msgCmdsRespondIfNotAllowed
          : msgCmdsRespondIfNoPerms;

      if (!respond) return message.delete().catch(() => {});
      return MessageCommandError.throw(message, eMsg, msgCmdsPreserveErrors, msgCmdsErrorDeleteDelay);
    }

    preserve = identifier === Identifiers.PreconditionClientPermissions;
    return MessageCommandError.throw(message, eMsg, preserve);
  }
}
