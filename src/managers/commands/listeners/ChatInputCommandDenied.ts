import { ChatInputCommandDeniedPayload, Events, Listener, UserError } from '@sapphire/framework';

import { MessageCommandError } from './MessageCommandError';

export class ChatInputCommandDenied extends Listener<typeof Events.ChatInputCommandDenied> {
  public constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.ChatInputCommandDenied });
  }

  public async run({ message }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    return MessageCommandError.throw(interaction, message);
  }
}
