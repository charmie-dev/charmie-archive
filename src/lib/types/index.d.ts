import { PrismaClient } from '@prisma/client';

export type ExtendedPrismaClientType = PrismaClient & {
  $extends: (extension: any) => ExtendedPrismaClient;
};
