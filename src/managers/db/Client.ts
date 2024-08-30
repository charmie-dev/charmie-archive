import { PrismaClient } from '@prisma/client';

import GuildCache from './GuildCache';

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

export type ExtendedPrismaClientType = PrismaClient & {
  $extends: (extension: any) => ExtendedPrismaClientType;
};
