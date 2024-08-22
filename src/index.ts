// Imports used for registering

import 'dotenv/config';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/framework';
import './lib/utils/prisma';

// Imports wrapped in {}

import { container } from '@sapphire/framework';
import { CharmieClient } from './lib/charmie/Client';
import { ExtendedPrismaClient } from './lib/utils/prisma';
import { ExtendedPrismaClientType } from './types';

// Other imports

import Logger, { AnsiColor } from './lib/utils/logger';
import ConfigManager from './lib/managers/config/ConfigManager';

/**
 * The main client class.
 *
 * It does not need to be exported as it's assigned to the #container {@link https://sapphirejs.dev/ Sapphire } exports.
 * @see {@link https://sapphirejs.dev/docs/Guide/additional-information/using-and-extending-container/ Sapphire Container}
 */

const client = new CharmieClient();

/**
 * The main extended prisma client to support custom caching.
 *
 * It does not need to be exported as it's assigned to the #container {@link https://sapphirejs.dev/ Sapphire } exports.
 * @see {@link https://sapphirejs.dev/docs/Guide/additional-information/using-and-extending-container/ Sapphire Container}
 */

const prisma = ExtendedPrismaClient;

/**
 * Main function to assign container & env properties, connect to the database, and initialize the client.
 *
 * @param env - The node environment (e.g production)
 */

async function main() {
  if (!process.env.BOT_TOKEN) {
    throw new Error('The environment variable BOT_TOKEN is not defined.');
  }

  if (!process.env.BOT_ID) {
    throw new Error('The environment variable BOT_ID is not defined.');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('The environment variable DATABASE_URL is not defined.');
  }

  // Initialize database connection & assign it to the container

  await prisma
    .$connect()
    .then(() => {
      Logger.log('DATABASE', 'Successfully connected to database.', {
        color: AnsiColor.Green,
        full: true
      });
    })
    .catch(() => {
      throw new Error('Database connection could not be initialized. Aborting startup.');
    });

  container.db = prisma;

  // Cache the global configuration

  ConfigManager.cacheGlobalConfig();

  // Login

  await client.login(process.env.BOT_TOKEN);
}

void main().catch(error => {
  Logger.error(error);
});

process.on('uncaughtException', error => {
  Logger.error('Uncaught exception:');
  console.error(error);
});

process.on('unhandledRejection', error => {
  Logger.error('Unhandled rejection:');
  console.error(error);
});

declare module '@sapphire/pieces' {
  interface Container {
    db: ExtendedPrismaClientType;
  }
}
