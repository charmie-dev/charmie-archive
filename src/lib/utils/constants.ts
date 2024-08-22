import { GatewayIntentBits, GuildMember, Options, Partials, Sweepers } from 'discord.js';
import { GuildConfig } from '../managers/config/schema';

export const CLIENT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildWebhooks
];

export const CLIENT_PARTIALS = [Partials.Channel, Partials.GuildMember, Partials.Message];

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

export const DEFAULT_GUILD_CONFIG: GuildConfig = {
  commands: {
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
  }
};
