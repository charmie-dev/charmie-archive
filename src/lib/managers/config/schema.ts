import { z } from 'zod';

// ————————————————————————————————————————————————————————————————————————————————
// Miscellaneous
// ————————————————————————————————————————————————————————————————————————————————

const zCron = z
  .string()
  .regex(
    /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|([\d*]+[/-]\d+)|\d+|\*) ?){5,7})$/gm
  );
const zSnowflake = z.string().regex(/^\d{17,19}$/gm);

// ————————————————————————————————————————————————————————————————————————————————
// Global Configuration
// ————————————————————————————————————————————————————————————————————————————————

// Global configuration schema exported for validation

export const globalConfigSchema = z.object({
  database: z.object({
    messages: z.object({
      insert_cron: zCron,
      delete_cron: zCron,
      // How long messages should be stored for (in milliseconds) - Default: 7 days
      ttl: z.number().min(1000).default(604800000)
    })
  }),
  commands: z.object({
    prefix: z.string().default('>')
  }),
  developers: z.array(zSnowflake).default([])
});

export type GlobalConfig = z.infer<typeof globalConfigSchema>;

// ————————————————————————————————————————————————————————————————————————————————
// Guild Configuration
// ————————————————————————————————————————————————————————————————————————————————

const overrideSchema = z.object({
  id: zSnowflake,
  commands: z.array(z.string()).default([]),
  excluded: z.array(zSnowflake).default([])
});

export type CommandOverride = z.infer<typeof overrideSchema>;

const allowedChannelSchema = z.object({
  id: zSnowflake,
  roles: z.array(zSnowflake).default([]),
  commands: z.array(z.string())
});

export type CommandAllowedChannel = z.infer<typeof allowedChannelSchema>;

const commandSchema = z.object({
  prefix: z.string().default('>'),
  disabled: z.array(z.string()).default([]),
  delete: z.boolean().default(false),
  respondIfNoPerms: z.boolean().default(true),
  respondIfDisabled: z.boolean().default(true),
  respondIfDisabledInChannel: z.boolean().default(true),
  preserveErrors: z.boolean().default(false),
  errorDeleteDelay: z.number().default(7500),
  moderatorPublic: z.boolean().default(false),
  overrides: z.array(overrideSchema).default([]),
  allowedChannels: z.array(allowedChannelSchema).default([])
});

/**
 * The guild configuration schema used for parsing/validation.
 */

export const configSchema = z.object({
  commands: commandSchema
});

export type GuildConfig = z.infer<typeof configSchema>;
