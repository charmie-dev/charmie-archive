import { z } from 'zod';

/**
 * The various schemas used for validation.
 *
 * Inspiration credits for this system go to {@link https://github.com/Rodis-Infrastructure/Azalea Azalea Discord Bot}.
 * As well as credits for the global config schema.
 */

// ————————————————————————————————————————————————————————————————————————————————
// Miscellaneous
// ————————————————————————————————————————————————————————————————————————————————

/**
 * Cron expression schema.
 */

const zCron = z
  .string()
  .regex(
    /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|([\d*]+[/-]\d+)|\d+|\*) ?){5,7})$/gm
  );

/**
 * Discord snowflake ID schema
 */
const zSnowflake = z.string().regex(/^\d{17,19}$/gm);

// ————————————————————————————————————————————————————————————————————————————————
// Global Configuration
// ————————————————————————————————————————————————————————————————————————————————

/**
 * The global configuration schema exported for parsing.
 */

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

const roleOverrideSchema = z.object({
  id: zSnowflake,
  commands: z.array(z.string()).default([]),
  excluded: z.array(zSnowflake).default([])
});

/**
 * Exported type for command override configuration.
 *
 * @remarks The `id` property is the ID of the role this override is for.
 * @remarks The `commands` array contains the names of commands that are allowed for this role.
 * @remarks The `excluded` array contains the IDs of roles that are excluded from this override. Users that have any of these roles will be excluded from this override even if they have the primary role.
 */

export type CommandRoleOverride = z.infer<typeof roleOverrideSchema>;

const channelOverrideSchema = z.object({
  id: zSnowflake,
  roles: z.array(zSnowflake).default([]),
  commands: z.array(z.string())
});

/**
 * Exported type for allowed channel configuration.
 *
 * @remarks The `id` property is the ID of the text channel, or category.
 * @remarks The `roles` array is an array that contains the role restrictions for the channel. If a user has any of the roles in the array, they will be able to use the commands in the channel.
 * @remarks The `commands` array is an array that contains the names of commands that are allowed in the channel.
 */

export type CommandChannelOverride = z.infer<typeof channelOverrideSchema>;
