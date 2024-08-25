import { Guilds as Guild } from '@prisma/client';
import { container, LogLevel } from '@sapphire/framework';
import { Collection } from 'discord.js';

import { DEFAULT_COMMANDS_CONFIG } from '../utils/constants';
import Logger, { AnsiColor } from '../utils/logger';

export default class GuildCache {
  /**
   * Collection cache for guilds to avoid database queries.
   */

  private static cache = new Collection<string, Guild>();

  /**
   * Retrieves the guild model for the specified guild from the database.
   *
   * @param guildId - The ID of the guild
   * @returns Guild - The guild model
   */

  public static async get(guildId: string): Promise<Guild> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;
    return await this.confirm(guildId);
  }

  /**
   * Confirms that the guild is in the database.
   *
   * @param guildId - The ID of the guild
   * @returns Guild - The guild model
   */

  public static async confirm(guildId: string): Promise<Guild> {
    const guild = await container.db.guilds.findUnique({
      where: {
        id: guildId
      }
    });

    if (guild) {
      this.cache.set(guildId, guild);
      return guild;
    }

    return await this._create(guildId);
  }

  /**
   * Creates a new guild and caches it.
   *
   * @param guildId - The ID of the guild to create
   * @returns Guild - The created guild
   */

  private static async _create(guildId: string): Promise<Guild> {
    const guild = await container.db.guilds.create({
      data: {
        id: guildId,
        command_config: DEFAULT_COMMANDS_CONFIG
      }
    });

    this.cache.set(guildId, guild);
    return guild;
  }

  /**
   * Removes a guild from the cache (most likely due to an update or deletion).
   *
   * @param guildId - The ID of the guild to remove
   * @returns boolean - If the guild was present in the cache and is now wiped
   */

  public static wipeCache(guildId: string): boolean {
    return this.cache.delete(guildId);
  }

  /**
   * Removes all guilds from the cache.
   */

  public static wipeAll(): void {
    Logger.log('CACHE', 'Wiping all guilds from cache...', { color: AnsiColor.Yellow, full: true });
    this.cache.clear();
    Logger.log('CACHE', 'Guild cache wiped.', { color: AnsiColor.Green, full: true });
  }
}
