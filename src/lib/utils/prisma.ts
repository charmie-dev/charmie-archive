import { PrismaClient } from '@prisma/client';

import { ExtendedPrismaClientType } from '../../types';
import GuildCache from '../managers/cache/GuildCache';

export const ExtendedPrismaClient = new PrismaClient().$extends({
  query: {
    guilds: {
      async update({ args, query }) {
        const result = await query(args);
        GuildCache.wipeCache(result.id!);
        return result;
      }
    }
  }
}) as ExtendedPrismaClientType;
