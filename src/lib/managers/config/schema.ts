import { z } from 'zod';

// ————————————————————————————————————————————————————————————————————————————————
// Miscellaneous
// ————————————————————————————————————————————————————————————————————————————————

const zSnowflake = z.string().regex(/^\d{17,19}$/gm);

// ————————————————————————————————————————————————————————————————————————————————
// Global Configuration
// ————————————————————————————————————————————————————————————————————————————————

// Global configuration schema exported for validation

export const globalConfigSchema = z.object({
  commands: z.object({
    prefix: z.string().default('!')
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
