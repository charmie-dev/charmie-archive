import { Sentry } from '@/index';
import { Events, Listener, MessageCommandErrorPayload, UserError } from '@sapphire/framework';
import { ChatInputCommandInteraction, Colors, InteractionReplyOptions, Message } from 'discord.js';

import { tryToReply } from '@/utils';

import Logger from '@/utils/logger';
import GuildCache from '../../db/GuildCache';

export class MessageCommandError extends Listener<typeof Events.MessageCommandError> {
  private static readonly DEFAULT_DELAY = 7500;

  public constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.MessageCommandError });
  }

  public async run(error: UserError, { message }: MessageCommandErrorPayload) {
    if (typeof error !== 'string') {
      const sentryId = Sentry.captureException(error);
      Logger.error(`[${sentryId}] Message command error:`, error);
      return MessageCommandError.throw(
        message,
        `An error occured while running this command, please include this ID when reporting the bug: \`${sentryId}\`.`,
        { preserve: true }
      );
    }

    if (message.inGuild()) {
      const { msgCmdsPreserveErrors: preserve, msgCmdsErrorDeleteDelay: delay } = await GuildCache.get(message.guildId);
      return MessageCommandError.throw(message, error, { preserve, delay });
    }

    return MessageCommandError.throw(message, error);
  }

  /**
   * Replies to the input with an error embed.
   *
   * @param message The input to reply to (will fallback to sending if the message can't be replied to)
   * @param error The error message to reply with
   * @param preserve Whether to preserve the message or not
   * @param delay The delay before deleting the message in milliseconds
   *
   * @returns void
   */

  public static async throw(
    interaction: Message | ChatInputCommandInteraction,
    error: string,
    options: { preserve?: boolean; delay?: number } = {}
  ): Promise<void> {
    const { preserve = false, delay = this.DEFAULT_DELAY } = options;

    const errorEmbed = { description: error, color: Colors.Red };

    if (interaction instanceof Message) {
      await this.handleMessageError(interaction, errorEmbed, preserve, delay);
    } else {
      await this.handleInteractionError(interaction, errorEmbed);
    }
  }

  /**
   * Handles message command errors.
   *
   * @param message The message to reply to
   * @param embed The error embed to send
   * @param preserve Whether to preserve the error message or not
   * @param delay The delay before deleting the message in milliseconds
   */

  private static async handleMessageError(
    message: Message,
    embed: { description: string; color: number },
    preserve: boolean,
    delay: number
  ): Promise<void> {
    const reply = await tryToReply(message, { embeds: [embed] });

    if (!preserve) {
      this.scheduleMessageDeletion(reply, message, delay);
    }
  }

  private static scheduleMessageDeletion(errorMsg: Message, originalMsg: Message, delay: number): void {
    setTimeout(() => {
      errorMsg.delete().catch(() => {});
      originalMsg.delete().catch(() => {});
    }, delay);
  }

  private static async handleInteractionError(
    interaction: ChatInputCommandInteraction,
    errorEmbed: { description: string; color: number }
  ): Promise<void> {
    const replyOptions: InteractionReplyOptions = { embeds: [errorEmbed] };

    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ ...replyOptions, ephemeral: true });
    } else {
      await interaction.editReply(replyOptions);
    }
  }
}
