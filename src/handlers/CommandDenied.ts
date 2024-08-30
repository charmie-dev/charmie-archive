import { ApplyOptions } from '@sapphire/decorators';
import { Events, Identifiers, Listener, MessageCommandDeniedPayload, UserError } from '@sapphire/framework';

import { PRECONDITION_IDENTIFIERS } from '../utils/constants';

import MessageCommandError from './CommandError';
import ConfigManager from '../managers/config/ConfigManager';

@ApplyOptions<Listener.Options>({ event: Events.MessageCommandDenied })
export default class MessageCommandDenied extends Listener<typeof Events.MessageCommandDenied> {
  public async run({ message: eMsg, identifier }: UserError, { message }: MessageCommandDeniedPayload) {
    if (identifier === PRECONDITION_IDENTIFIERS.Silent || identifier === Identifiers.PreconditionGuildOnly) return;

    let respond = true;
    let preserve = false;

    if (message.inGuild()) {
      const { preserveErrors, errorDeleteDelay, respondIfDisabled, respondIfNoPerms, respondIfDisabledInChannel } =
        await ConfigManager.getCommandConfig(message.guildId);

      respond =
        identifier === PRECONDITION_IDENTIFIERS.CommandDisabled
          ? respondIfDisabled
          : identifier === PRECONDITION_IDENTIFIERS.CommandDisabledInChannel
          ? respondIfDisabledInChannel
          : respondIfNoPerms;

      if (!respond) return message.delete().catch(() => {});
      return MessageCommandError.throw(message, eMsg, preserveErrors, errorDeleteDelay);
    }

    preserve = identifier === Identifiers.PreconditionClientPermissions;
    return MessageCommandError.throw(message, eMsg, preserve);
  }
}