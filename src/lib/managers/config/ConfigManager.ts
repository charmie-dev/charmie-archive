import { fromZodError } from 'zod-validation-error';
import { readYamlFile } from '../../utils';
import { configSchema, GlobalConfig, globalConfigSchema, GuildConfig } from './schema';

import Logger, { AnsiColor } from '../../utils/logger';
import fs from 'node:fs';
import GuildCache from '../cache/GuildCache';

/**
 * The config manager class.
 *
 * Used to parse JSON configuration data from the {Guilds} prisma model,
 * and to cache the global configuration.
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
   * @param guildId - The ID of the guild
   * @returns GuildConfig | null - The config type or null in case it could not be parsed
   */

  static async getGuildConfig(guildId: string): Promise<GuildConfig> {
    const guild = await GuildCache.get(guildId);

    const rawConfig = guild.config;
    const parseResult = configSchema.safeParse(rawConfig);

    return parseResult.data as GuildConfig;
  }
}
