import { ChatInputCommandErrorPayload, Events, Listener, UserError } from '@sapphire/framework';

import { MessageCommandError } from './MessageCommandError';
import { Sentry } from '@/index';

import Logger from '@/utils/logger';

export class ChatInputCommandError extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.ChatInputCommandError });
  }

  public async run(error: UserError, { interaction }: ChatInputCommandErrorPayload) {
    if (typeof error !== 'string') {
      const sentryId = Sentry.captureException(error);
      Logger.error(`[${sentryId}] Chat input command error:`, error);
      return MessageCommandError.throw(
        interaction,
        `An error occured while running this command, please include this ID when reporting the bug: \`${sentryId}\`.`
      );
    }

    return MessageCommandError.throw(interaction, error);
  }
}
