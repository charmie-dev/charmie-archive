import { Messages as Message } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Collection, Snowflake, Message as DiscordMessage, cleanContent, PartialMessage } from 'discord.js';

import { EMPTY_MESSAGE_CONTENT, LOG_ENTRY_DATE_FORMAT, MESSAGE_DELETE_THRESHOLD } from '../../utils/constants';
import { pluralize } from '../../utils/index';

import Logger from '../../utils/logger';
import ConfigManager from '../config/ConfigManager';
import CronUtils from '../../utils/cron';

/**
 * The message caching system/class.
 *
 * This class is used to cache messages for a period of time before deleting them.
 * The configured time depends on the `charmie.cfg.yml` file.
 *
 * Full credits for this system go to the {@link https://github.com/Rodis-Infrastructure/Azalea Azalea Discord Bot}.
 */
export default class MessageCache {
  /**
   * The messages that have not been stored in the database yet.
   */
  private static readonly _dbQueue = new Collection<Snowflake, Message>();

  /**
   * The most recent message delete audit log.
   * Used to improve the accuracy for blaming.
   */

  private static _messageDeleteAuditLog?: MessageDeleteAuditLog;
  /**
   * The que for the messages that need to be purged.
   */
  public static _purgeQueue: PurgeOptions[] = [];

  static async get(id: Snowflake): Promise<Message | null> {
    let message = MessageCache._dbQueue.get(id) ?? null;

    if (!message) {
      message = await container.db.messages.findUnique({ where: { id } });
    }

    return message;
  }

  /**
   * Get the current database queue size.
   * @returns The number of messages in the database queue
   */

  static getQueueSize(): number {
    return MessageCache._dbQueue.size;
  }

  /**
   * Gets the user responsible for the deletion.
   *
   * @param data The audit log data.
   * @returns The id of the user responsible for the deletion.
   */

  static getBlame(data: MessageDeleteAuditLog): Snowflake | null {
    const log = MessageCache._messageDeleteAuditLog;
    const logHasChanged =
      !log || log.channelId !== data.channelId || log.targetId !== data.targetId || log.executorId !== data.executorId;

    /**
     * A new audit log has been created,
     * meaning the count of the previous log was reset and is no longer needed.
     */
    if (logHasChanged) {
      MessageCache._messageDeleteAuditLog = data;
      const dateDiff = Date.now() - data.createdAt.getTime();

      // The log is new and the count is 1
      if (data.count === 1 && dateDiff < 3000) {
        return data.executorId;
      }

      return null;
    }

    // The log is the same and the count has increased by one
    if (data.count === log.count + 1) {
      log.count++;
      return data.executorId;
    }

    return null;
  }

  /**
   * Get a user's messages from cache or the database
   *
   * @param userId - The target user's ID
   * @param channelId - The source channel's ID
   * @param period - The period over which to remove the messages (in milliseconds)
   * @param limit - The maximum number of messages to return
   */
  static async deleteMessagesByUser(
    userId: Snowflake,
    channelId: Snowflake,
    limit: number,
    period?: number
  ): Promise<Message[]> {
    const messages = [];

    // Ensure the period doesn't exceed the message TTL
    if (!period || period > MESSAGE_DELETE_THRESHOLD) {
      period = MESSAGE_DELETE_THRESHOLD;
    }

    for (const message of MessageCache._dbQueue.values()) {
      if (message.authorId !== userId || message.channelId !== channelId || message.deleted) continue;

      if (messages.length === limit) break;

      message.deleted = true;
      messages.push(message);
    }

    // Fetch remaining messages from the database if an insufficient amount was cached
    if (messages.length < limit) {
      const msCreatedAtThreshold = Date.now() - period;

      // The messages have to be fetched first since LIMIT cannot be used with update()
      const stored = await container.db.messages.findMany({
        where: {
          authorId: userId,
          channelId: channelId,
          createdAt: { gt: new Date(msCreatedAtThreshold) },
          deleted: false
        },
        orderBy: { createdAt: 'desc' },
        take: limit - messages.length
      });

      // Update the deletion state of the stored messages
      await container.db.messages.updateMany({
        where: {
          id: { in: stored.map(message => message.id) }
        },
        data: { deleted: true }
      });

      // Combined cached and stored messages
      return messages.concat(stored);
    }

    return messages;
  }

  // Add a message to the database queue
  static queue(message: DiscordMessage<true>): void {
    const serializedMessage = MessageCache.serialize(message);
    MessageCache._dbQueue.set(message.id, serializedMessage);
  }

  /**
   * Update the deletion state of a message
   * @param id - ID of the message to delete
   */
  static async delete(id: Snowflake): Promise<Message | null> {
    // Try to get the message form cache
    let message = MessageCache._dbQueue.get(id) ?? null;

    // Modify the cache if the message is cached
    // Otherwise, update the message in the database
    if (message) {
      message.deleted = true;
    } else {
      message = await container.db.messages
        .update({
          data: { deleted: true },
          where: { id }
        })
        .catch(() => null);
    }

    return message;
  }

  /**
   * Update the deletion state of multiple messages in bulk
   *
   * @param messageCollection - The messages to delete
   */
  static async deleteMany(
    messageCollection: Collection<Snowflake, PartialMessage | DiscordMessage<true>>
  ): Promise<Message[]> {
    const ids = Array.from(messageCollection.keys());

    // Try to get the messages from cache
    const messages = MessageCache._dbQueue.filter(message => ids.includes(message.id) && !message.deleted);

    // Update the deletion state of the cached messages
    const deletedMessages = messages.map(message => {
      message.deleted = true;
      return message;
    });

    // Update whatever wasn't cached in the database
    if (messages.size !== deletedMessages.length) {
      const dbDeletedMessages = await container.db.$queryRaw<Message[]>`
                    UPDATE Message
                    SET deleted = true
                    WHERE id IN (${ids.join(',')}) RETURNING *;
                `;

      // Merge the cached and stored messages
      return deletedMessages.concat(dbDeletedMessages);
    }

    return deletedMessages;
  }

  /**
   * Update the content of a message in cache and/or the database
   *
   * @param id - ID of the message to update
   * @param newContent - The new content of the message
   */
  static async updateContent(id: Snowflake, newContent: string): Promise<string> {
    // Try to get the message from cache
    const message = MessageCache._dbQueue.get(id);

    // Modify the cache if the message is cached
    if (message) {
      const oldContent = message.content ?? EMPTY_MESSAGE_CONTENT;
      message.content = newContent;

      return oldContent;
    }

    // Update the message in the database
    const { old_content } = await container.db.$queryRaw<{ old_content: string | null }>`
                UPDATE Message
                SET content = ${newContent}
                WHERE id = ${id} 
                RETURNING (
                    SELECT content
                    FROM Message
                    WHERE id = ${id}
                ) AS old_content;
            `;

    return old_content ?? EMPTY_MESSAGE_CONTENT;
  }

  // Clear the cache and store the messages in the database
  static async store(): Promise<void> {
    Logger.info('Storing cached messages...');

    // Insert all cached messages into the database
    const messages = Array.from(MessageCache._dbQueue.values());
    const { count } = await container.db.messages.createMany({ data: messages });

    // Empty the cache
    MessageCache._dbQueue.clear();

    if (!count) {
      Logger.info('No messages were stored');
    } else {
      Logger.info(`Stored ${count} ${pluralize(count, 'message')}`);
    }
  }

  // Start a cron job that will clear the cache and store the messages in the database
  static startDatabaseCronJob(): void {
    const insertionCron = ConfigManager.global_config.database.messages.insert_cron;
    const deletionCron = ConfigManager.global_config.database.messages.delete_cron;
    const ttl = ConfigManager.global_config.database.messages.ttl;

    // Store cached messages
    CronUtils.startJob('STORE_NEW_MESSAGES', insertionCron, async () => {
      await MessageCache.store();
    });

    // Remove messages that exceed the TTL from the database
    CronUtils.startJob('DELETE_OLD_MESSAGES', deletionCron, async () => {
      const createdAtThreshold = new Date(Date.now() - ttl);
      const createdAtString = createdAtThreshold.toLocaleString(undefined, LOG_ENTRY_DATE_FORMAT);

      Logger.info(`Deleting messages created before ${createdAtString}...`);

      const { count } = await container.db.messages.deleteMany({
        where: { createdAt: { lte: createdAtThreshold } }
      });

      if (!count) {
        Logger.info(`No messages were created before ${createdAtString}`);
      } else {
        Logger.info(`Deleted ${count} ${pluralize(count, 'message')} created before ${createdAtString}`);
      }
    });
  }

  /** @returns Message object in a format appropriate for the database */
  static serialize(message: DiscordMessage<true>): Message {
    const stickerId = message.stickers.first()?.id ?? null;
    const referenceId = message.reference?.messageId ?? null;

    return {
      id: message.id,
      channelId: message.channelId,
      authorId: message.author.id,
      guildId: message.guildId,
      createdAt: message.createdAt,
      content: cleanContent(message.content, message.channel),
      stickerId: stickerId,
      referenceId: referenceId,
      deleted: false
    };
  }
}

interface PurgeOptions {
  // The channel messages were purged from
  channelId: Snowflake;
  // The purged messages
  messages: Message[];
}

interface MessageDeleteAuditLog {
  // The user responsible for deleting the message
  executorId: Snowflake;
  // The author of the deleted message
  targetId: Snowflake;
  // The channel the message was deleted from
  channelId: Snowflake;
  // The time the message was deleted
  createdAt: Date;
  // The number of messages that were deleted
  count: number;
}
