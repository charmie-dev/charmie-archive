import { SapphireClient, Events, LogLevel, ApplicationCommandRegistries, RegisterBehavior } from '@sapphire/framework';
import { getRootData } from '@sapphire/pieces';
import { type Message } from 'discord.js';
import { join } from 'node:path';

import { CLIENT_CACHE_OPTIONS, CLIENT_INTENTS, CLIENT_PARTIALS, CLIENT_SWEEPER_OPTIONS } from './constants';

import ConfigManager from '@managers/config/ConfigManager';
import GuildCache from '@managers/db/GuildCache';

export class CharmieClient extends SapphireClient {
  // Root data

  private rootData = getRootData();

  constructor() {
    super({
      // Command options

      loadMessageCommandListeners: true,
      caseInsensitiveCommands: true,
      caseInsensitivePrefixes: true,

      // Miscellaneous Options

      loadDefaultErrorListeners: false,
      enableLoaderTraceLoggings: true,

      // Application command registry options

      loadApplicationCommandRegistriesStatusListeners: true,

      // Default regex prefix - Hardcoded to avoid adding to global config file

      regexPrefix: /^(hey +)?(charmie|ch)[,! ]/i,

      // Logger level

      logger: {
        level: LogLevel.None
      },

      /**
       * Fetches the prefix for the given message.
       *
       * @param message - Discord message type
       * @returns Prefix (as a string) for the given message
       */

      fetchPrefix: async (message: Message) => {
        return message.inGuild()
          ? (await GuildCache.get(message.guildId)).msgCmdsPrefix
          : ConfigManager.global_config.commands.prefix;
      },

      /**
       * Gateway intents (bits).
       *
       * The following privileged intents are required for the bot to work:
       *
       * 1. Server Members Intent - For handling guild member events
       * 2. Message Content Intent - For handling legacy commands/automoderation
       *
       * If these intents have not been granted the client will not login
       * @see https://discord.com/developers/docs/topics/gateway#gateway-intents
       */

      intents: CLIENT_INTENTS,

      partials: CLIENT_PARTIALS,

      /**
       * Cache settings for the client.
       *
       * A message cache of 100 or above is required for proper storing of messages
       * Message database storing is essential and used for many utility related functions
       */

      makeCache: CLIENT_CACHE_OPTIONS,

      /**
       * Sweepers for the cache.
       *
       * guildMembers - Sweeps the guild member cache but excludes the client
       *
       * Note: We automatically sweep messages as they get queued for database storing on {@link Events.MessageCreate}
       *       so keeping them in 2 caches is not neccessary
       *       Messages are sweeped every 2 hours, and they must be older than 1 hour to get sweeped
       *
       * Warning: These cache settings do lead in higher memory usage
       *          If you do not have appropriate available memory please lower these numbers
       */

      sweepers: CLIENT_SWEEPER_OPTIONS,
      allowedMentions: {
        // All mentions are disabled by default
        parse: []
      }
    });

    /**
     * We register a store for interaction handlers under the name "interactions" for ease of access.
     */

    this.stores.get('interaction-handlers').registerPath(join(this.rootData.root, 'interactions'));

    /**
     * We register a second store for listeners that handle client events.
     *
     * E.g {@link Events.ClientReady}, which runs when the client has fully logged in
     */

    this.stores.get('listeners').registerPath(join(this.rootData.root, 'events'));
  }

  override async login(token: string) {
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
    return super.login(token);
  }
}
