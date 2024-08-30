import { fromZodError } from 'zod-validation-error';
import { Snowflake } from 'discord.js';

import fs from 'node:fs';

import { readYamlFile } from '../../utils';
import { CommandConfig, commandSchema, GlobalConfig, globalConfigSchema } from './schema';
import { DEFAULT_COMMANDS_CONFIG } from '../../utils/constants';

import Logger, { AnsiColor } from '../../utils/logger';
import GuildCache from '../db/GuildCache';

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
   * Get the command configuration for a guild.
   *
   * Warning: This method will return the default configuration if the command configuration is (somehow) invalid.
   *
   * @param guildId The id of the guild
   * @returns The parsed configuration
   */

  static async getCommandConfig(guildId: Snowflake) {
    const { command_config } = await GuildCache.get(guildId);

    const parseResult = commandSchema.safeParse(command_config);

    if (!parseResult.success) return ConfigManager.getDefaultCommandConfig(guildId);

    return parseResult.data as CommandConfig;
  }

  /**
   * Logs to the console that the default command configuration was returned for a guild that does not have a valid config.
   *
   * @param guildId The ID of the guild
   * @returns The default command configuration + a warning in the console.
   */

  static getDefaultCommandConfig(guildId: Snowflake) {
    Logger.warn(
      `Returned the default command configuration for guild with ID ${guildId} as the command configuration parsed from the database was invalid.`
    );
    return DEFAULT_COMMANDS_CONFIG;
  }
}
