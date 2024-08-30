import { Colors, GatewayIntentBits, GuildMember, Options, Partials, PermissionFlagsBits, Sweepers } from 'discord.js';

import { CommandConfig } from '../managers/config/schema';
import { MappedFlag, MappedOption } from '../managers/commands/Command';

/**
 * This file contains all the constants used throughout the bot.
 *
 * Credits for some of the constants here go to the {@link https://github.com/Rodis-Infrastructure/Azalea Azalea Discord Bot}.
 * As well as credits for the overall naming structure for the exported constants.
 */

// ————————————————————————————————————————————————————————————————————————————————
// Client configuration
// ————————————————————————————————————————————————————————————————————————————————

/**
 * The gateway intent bits for the client.
 */

export const CLIENT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildWebhooks
];

/**
 * The partials for the client.
 */

export const CLIENT_PARTIALS = [Partials.Channel, Partials.GuildMember, Partials.Message];

/**
 * The cache options for the client.
 */

export const CLIENT_CACHE_OPTIONS = Options.cacheWithLimits({
  ...Options.DefaultMakeCacheSettings,
  GuildMessageManager: 100, // Channel messages
  BaseGuildEmojiManager: 0, // Guild emojis
  StageInstanceManager: 0, // Guild stage instances
  ThreadManager: 0, // Channel threads
  AutoModerationRuleManager: 0, // Automoderation rules
  DMMessageManager: 0, // DM messages
  GuildForumThreadManager: 0,
  GuildInviteManager: 0, // Guild invites
  PresenceManager: 0, // Guild presences
  GuildScheduledEventManager: 0, // Guild scheduled events
  ThreadMemberManager: 0 // Thread members
});

/**
 * The sweeper options for the client.
 */

export const CLIENT_SWEEPER_OPTIONS = {
  ...Options.DefaultSweeperSettings,
  guildMembers: {
    interval: 600,
    filter: Sweepers.filterByLifetime({
      lifetime: 600,
      excludeFromSweep: (member: GuildMember) => member.id !== process.env.BOT_ID!
    })
  },
  messages: {
    interval: 7200,
    filter: Sweepers.filterByLifetime({
      lifetime: 7200 / 2
    })
  }
};

// ————————————————————————————————————————————————————————————————————————————————
// Default configurations
// ————————————————————————————————————————————————————————————————————————————————

export const DEFAULT_COMMANDS_CONFIG: CommandConfig = {
  prefix: '>',
  delete: false,
  disabled: [],
  respondIfNoPerms: true,
  respondIfDisabled: true,
  respondIfDisabledInChannel: true,
  errorDeleteDelay: 7500,
  preserveErrors: false,
  moderatorPublic: false,
  overrides: [],
  allowedChannels: []
};

// ————————————————————————————————————————————————————————————————————————————————
// Miscellaneous
// ————————————————————————————————————————————————————————————————————————————————

export const EXIT_EVENTS = [
  'SIGHUP',
  'SIGINT',
  'SIGQUIT',
  'SIGILL',
  'SIGTRAP',
  'SIGABRT',
  'SIGBUS',
  'SIGFPE',
  'SIGUSR1',
  'SIGSEGV',
  'SIGUSR2',
  'SIGTERM'
];

export const DEFAULT_EMBED_COLOR = Colors.NotQuiteBlack;

export const DEFAULT_TIMEZONE = 'GMT';

export const MESSAGE_DELETE_THRESHOLD = 1000 * 60 * 60 * 24 * 13;

export const EMPTY_MESSAGE_CONTENT = 'Unknown content.';

export const LOG_ENTRY_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: DEFAULT_TIMEZONE,
  hour12: false
};

// ————————————————————————————————————————————————————————————————————————————————
// Various command related utilities or constants
// ————————————————————————————————————————————————————————————————————————————————

export const EVAL_CMD_MFLAGS: MappedFlag[] = [
  { name: 'async', aliases: ['a'] },
  { name: 'silent', aliases: ['s'] },
  { name: 'hide', aliases: ['h'] },
  { name: 'show', aliases: ['sh'] }
];

export const EVAL_CMD_MOPTIONS: MappedOption[] = [{ name: 'depth', aliases: ['d'] }];

export const COMMON_STAFF_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageMessages
];

export const MODERATION_COMMANDS = ['warn', 'mute', 'kick', 'ban', 'unmute', 'unban'];

export enum PRECONDITION_IDENTIFIERS {
  Silent = 'Silent',
  CommandDisabled = 'CommandDisabled',
  CommandDisabledInChannel = 'CommandDisabledInChannel',
  NoPermissions = 'NoPermissions'
}
