import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, MessageCommandErrorPayload, UserError } from '@sapphire/framework';
import { Colors, Message } from 'discord.js';

import { sendOrReply } from '../utils';
import { Sentry } from '..';

import Logger from '../utils/logger';
import GuildCache from '../managers/db/GuildCache';

@ApplyOptions<Listener.Options>({ event: Events.MessageCommandError })
export default class MessageCommandError extends Listener<typeof Events.MessageCommandError> {
 run(uError: UserError, { message }: MessageCommandErrorPayload) {
    if (typeof uError !== 'string') {
      const sentryId = Sentry.captureException(uError);
      Logger.error(`Message command error: ${uError}`, uError);
      return MessageCommandError.throw(
        message,
        `An error occured while running this command, please include this ID when reporting the bug: \`${sentryId}\`.`,
        true
      );
    }

    if (message.inGuild()) {
      const { msgCmdsPreserveErrors, msgCmdsErrorDeleteDelay } = await GuildCache.get(message.guildId);
      return MessageCommandError.throw(message, uError, msgCmdsPreserveErrors, msgCmdsErrorDeleteDelay);
    }

    return MessageCommandError.throw(message, uError);
  }

  /**
   * Replies to the message with an error embed.
   *
   * @param message The message to reply to (will fallback to sending if the message can't be replied to)
   * @param error The error message to reply with
   * @param preserve Whether to preserve the message or not
   * @param delay The delay before deleting the message in milliseconds
   *
   * @returns void
   */

  public static async throw(
    message: Message,
    error: string,
    preserve: boolean = false,
    delay: number = 7500
  ): Promise<void> {
    const errorMsg = await sendOrReply(message, {
      embeds: [{ description: error, color: Colors.Red }]
    });

    if (!preserve) {
      setTimeout(() => {
        errorMsg.delete().catch(() => {});
        message.delete().catch(() => {});
      }, delay);
    }
  }
}
