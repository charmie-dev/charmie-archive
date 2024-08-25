import { PrismaClient } from '@prisma/client';

import { ExtendedPrismaClientType } from '../types';

import GuildCache from '../cache/GuildCache';
import Logger from './logger';

export const ExtendedPrismaClient = new PrismaClient().$extends({
  query: {
    guilds: {
      async update({ args, query }) {
        const result = await query(args);
        GuildCache.wipeCache(result.id!);
        return result;
      },
      async delete({ args, query }) {
        const result = await query(args);
        GuildCache.wipeCache(result.id!);
        return result;
      },
      async deleteMany({ args, query }) {
        const result = await query(args);
        GuildCache.wipeAll();
        return result;
      }
    }
  }
}) as ExtendedPrismaClientType;
