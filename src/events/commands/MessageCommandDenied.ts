import { ApplyOptions } from '@sapphire/decorators';
import { Events, Identifiers, Listener, MessageCommandDeniedPayload, UserError } from '@sapphire/framework';

import { embeddedError } from '../../lib/utils';
import { PRECONDITION_IDENTIFIERS } from '../../lib/utils/constants';

@ApplyOptions<Listener.Options>({ event: Events.MessageCommandDenied })
export default class MessageCommandDenied extends Listener<typeof Events.MessageCommandDenied> {
  public async run({ message: eMsg, identifier }: UserError, { message }: MessageCommandDeniedPayload) {
    if (identifier === PRECONDITION_IDENTIFIERS.Silent || identifier === Identifiers.PreconditionGuildOnly) return;

    const preserve = identifier === Identifiers.PreconditionClientPermissions;
    return embeddedError(message, eMsg, preserve);
  }
}
