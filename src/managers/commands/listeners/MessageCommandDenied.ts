import { Events, Identifiers, Listener, MessageCommandDeniedPayload, UserError } from '@sapphire/framework';

import { MessageCommandError } from './MessageCommandError';
import { PRECONDITION_IDENTIFIERS } from '@/utils/constants';

import GuildCache from '../../db/GuildCache';

export class MessageCommandDenied extends Listener<typeof Events.MessageCommandDenied> {
  public constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.MessageCommandDenied });
  }

  public async run({ message: eMsg, identifier }: UserError, { message }: MessageCommandDeniedPayload) {
    if (identifier === PRECONDITION_IDENTIFIERS.Silent || identifier === Identifiers.PreconditionGuildOnly) return;

    let respond = true;
    let preserve = false;

    if (message.inGuild()) {
      const {
        msgCmdsPreserveErrors: preserve,
        msgCmdsErrorDeleteDelay: delay,
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
      return MessageCommandError.throw(message, eMsg, { preserve, delay });
    }

    preserve = identifier === Identifiers.PreconditionClientPermissions;
    return MessageCommandError.throw(message, eMsg, { preserve });
  }
}
