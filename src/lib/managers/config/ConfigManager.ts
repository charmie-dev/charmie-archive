import { fromZodError } from 'zod-validation-error';
import { container } from '@sapphire/framework';
import { Snowflake } from 'discord.js';

import fs from 'node:fs';

import { readYamlFile } from '../../utils';
import { configSchema, GlobalConfig, globalConfigSchema, GuildConfig } from './schema';
import { DEFAULT_GUILD_CONFIG } from '../../utils/constants';

import Logger, { AnsiColor } from '../../utils/logger';
import GuildCache from '../../cache/GuildCache';

/**
 * The config manager class.
 *
 * Used to parse JSON configuration data from the {Guilds} prisma model,
 * and to cache the global configuration.
 *
 * Full credits for this system go to the {@link https://github.com/Rodis-Infrastructure/Azalea Azalea Discord Bot}.
 */

export default class ConfigManager {
  static global_config: GlobalConfig;

  /**
   * Load the global configuration from the global configuration file.
   */

  static cacheGlobalConfig(): void {
    Logger.info('Caching global configuration...');

    if (!fs.existsSync('charmie.cfg.yml')) {
      Logger.error('Unable to find global configuration file. Exiting process...');
      process.exit(1);
    }

    // Load and parse the global config from the .yml file
    const rawConfig = readYamlFile<GlobalConfig>('charmie.cfg.yml');
    ConfigManager.global_config = ConfigManager.parseGlobalConfig(rawConfig);

    Logger.log('CONFIG', 'Successfully cached global configuration.', { color: AnsiColor.Green, full: true });
  }

  /**
   * Parse the global config from the global config file.
   *
   * @param data - Unknown type of data to be parsed from the global config
   * @returns GlobalConfig - The parsed global configuration
   */

  static parseGlobalConfig(data: unknown): GlobalConfig {
    const parseResult = globalConfigSchema.safeParse(data);

    if (!parseResult.success) {
      const validationError = fromZodError(parseResult.error);
      Logger.error(validationError.toString());
      process.exit(1);
    }

    return parseResult.data;
  }

  /**
   * Get the parsed configuration of a guild.
   *
   * Warning: This method will return the default configuration if the guild configuration is (somehow) invalid.
   *
   * @param guildId - The ID of the guild
   * @returns The guild configuration
   */

  static async getGuildConfig(guildId: Snowflake): Promise<GuildConfig> {
    const { config } = await GuildCache.get(guildId);

    const parseResult = configSchema.safeParse(config);

    if (!parseResult.success) return ConfigManager.getDefaultGuildConfig(guildId);
    return parseResult.data as GuildConfig;
  }

  /**
   * Logs to the console that the default configuration was returned for a guild that does not have a valid config.
   *
   * @param guildId The ID of the guild
   * @returns The default guild configuration + a warning in the console.
   */

  static getDefaultGuildConfig(guildId: Snowflake): GuildConfig {
    Logger.warn(
      `Returned the default configuration for guild with ID ${guildId} as the configuration parsed from the database was invalid.`
    );
    return DEFAULT_GUILD_CONFIG;
  }

  /**
   * Applies the default configuration to a guild.
   *
   * @param guildId The guild to apply y the default configuration to
   * @returns The default guild configuration
   */

  static async resetGuildConfig(guildId: Snowflake) {
    await container.db.guilds.update({ where: { id: guildId }, data: { config: DEFAULT_GUILD_CONFIG } });
    Logger.warn(`Default configuration applied to guild ${guildId}.`);
    return DEFAULT_GUILD_CONFIG;
  }
}
