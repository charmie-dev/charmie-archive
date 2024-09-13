import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
  ContextMenuCommandInteraction,
  EmbedField,
  Guild,
  GuildBasedChannel,
  GuildMember,
  Message,
  MessageCreateOptions,
  ModalSubmitInteraction,
  Role,
  Snowflake,
  TextBasedChannel,
  ThreadChannel,
  cleanContent as djsCleanContent
} from 'discord.js';

import { Container, container } from '@sapphire/framework';
import { reply, send } from '@sapphire/plugin-editable-commands';

import YAML from 'yaml';
import fs from 'fs';
import ms from 'ms';

import { CommandRoleOverride, GlobalConfig } from '@managers/config/schema';
import { COMMON_STAFF_PERMISSIONS, MODERATION_COMMANDS } from './constants';
import { CommandCategory } from '@managers/commands/Command';

import Logger from './logger';
import { Guilds as DatabaseGuild } from '@prisma/client';

/**
 * This file contains utility functions that are used throughout the bot.
 *
 * Credits for a most of these functions go to the {@link https://github.com/Rodis-Infrastructure/Azalea Azalea Discord Bot}.
 */

/**
 * Reads a YAML file from the given path and returns the parsed content.
 *
 * @param path - The path to the YAML file.
 * @template T - The type of the parsed content.
 * @returns {T} The parsed content of the YAML file.
 */
export function readYamlFile<T>(path: string): T {
  const raw = fs.readFileSync(path, 'utf-8');
  return YAML.parse(raw);
}

/**
 * Uploads data to hastebin.
 *
 * @param data - The data to upload
 * @param ext - The extension of the file (by default .js)
 * @returns string - The url of the document
 */

export async function createHastebinPaste(data: any, ext: string = 'js'): Promise<string> {
  const binReq = await fetch('https://hst.sh/documents', {
    method: 'POST',
    body: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
  });

  if (!binReq.ok) throw `Error uploading to hastebin. Status code \`${binReq.status}\`.`;
  const bin = (await binReq.json()) as { key: string };
  return `https://hst.sh/${bin.key}.${ext}`;
}

/**
 * Converts a { Snowflake } to a formatted string with the format <@${Snowflake}}> (\`${Snowflake}\`).
 *
 * @param user - The user to convert
 * @returns string - The formatted string
 */

export function userMentionWithId(id: Snowflake): `<@${Snowflake}> (\`${Snowflake}\`)` {
  return `<@${id}> (\`${id}\`)`;
}

/**
 * Converts a { channel } object to a string with the format <#${Snowflake}> (\`#${string}\`).
 *
 * @param channel - The channel to format
 * @returns string - The formatted string
 */

export function channelMentionWithName(channel: GuildBasedChannel | ThreadChannel): `<#${Snowflake}> (\`#${string}\`)` {
  return `<#${channel.id}> (\`#${channel.name}\`)`;
}

/**
 * Converts a { role } object to a string with the format <@&${Snowflake}> (\`@${string}\`).
 *
 * @param role - The role to format
 * @returns string - The formatted string
 */

export function roleMentionWithName(role: Role): `<@&${Snowflake}> (\`@${string}\`)` {
  return `<@&${role.id}> (\`@${role.name}\`)`;
}

/**
 * Pluralizes a word based on the given count
 *
 * @param count - The count used to determine the plural form
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word, defaults to `{singular}s`
 * @returns The pluralized word
 */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/**
 * Takes a string and cleans it up for display.
 *
 * @param str The string to clean up
 * @param channel The message channel
 * @returns string - The cleaned up string
 */

export function cleanContent(str: string, channel: TextBasedChannel): string {
  // Escape custom emojis
  str = str.replace(/<(a?):([^:\n\r]+):(\d{17,19})>/g, '<$1\\:$2\\:$3>');
  // Add IDs to mentions
  str = str.replace(/<@!?(\d{17,19})>/g, `<@$1> ($1)`);
  return djsCleanContent(str, channel);
}

/**
 * Disconnects from the database and logs the termination.
 */

export async function terminateDbConnection(): Promise<void> {
  Logger.info('Terminating database connection...');

  await container.db.$disconnect().then(() => {
    Logger.info('Successfully disconnected from database.');
  });
}

/**
 * Attempts to reply to a message, or send a message if the message is not available to be replied to.
 *
 * @param message The message to reply to
 * @param content The content to send (or message create options)
 *
 * @returns {@link Message} The message that was sent
 */

export async function tryToReply(message: Message, content: string | MessageCreateOptions): Promise<Message> {
  return reply(message, content).catch(() => {
    return send(message, content);
  });
}

/**
 * Performs various permission checks on a given member.
 *
 * @param member The member to check permissions for
 * @param config The guild configuration
 * @returns boolean Whether the member passed the permission checks
 */

export function permissionsCheck(member: GuildMember, guild: Guild, config: DatabaseGuild): boolean {
  if (member.id === guild.ownerId) return true;
  if (member.permissions.any(COMMON_STAFF_PERMISSIONS, true)) return true;

  const overrides = config.msgCmdsRoleOverrides as CommandRoleOverride[];
  if (overrides.length === 0) return false;

  if (
    overrides.some(
      override =>
        member.roles.cache.some(role => role.id === override.id) &&
        override.commands.some(cmd => MODERATION_COMMANDS.includes(cmd))
    )
  )
    return true;

  return false;
}

/**
 * Generates the embed fields for the help command.
 *
 * @param config The global configuration
 * @param authorId The id of the author
 * @param container The container imported from sapphire
 * @returns embed fields
 */

export function generateHelpFields(config: GlobalConfig, authorId: string, container: Container): EmbedField[] {
  const categories = Object.values(CommandCategory);
  const commandStore = container.stores.get('commands');

  return categories.flatMap(category => {
    const commands = [...commandStore.values()]
      .filter(c => c.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (commands.length === 0) return [];

    const field: EmbedField = {
      name: category,
      value: commands.map(c => `\`${c.name}\``).join(', '),
      inline: false
    };

    if (category === CommandCategory.Developer && !config.developers.includes(authorId)) return [];
    const fields = [field];

    return fields;
  });
}

/**
 * Capitalize the first letter of a string.
 *
 * @param str The string to capitalize
 * @returns The capitalized string
 */

export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parse a duration string into a number of milliseconds.
 *
 * @param durationStr The duration string to parse
 * @returns The duration in milliseconds
 */

export function parseDuration(durationStr: string | null): number {
  if (durationStr === null) return NaN;

  const numericValue = Number(durationStr);

  if (!isNaN(numericValue)) return numericValue * 1000;
  return ms(durationStr) ?? NaN;
}

/**
 * Check if a member has a higher role than another member.
 *
 * @param executor The executor
 * @param target The target
 * @returns boolean (Whether the executor has a higher role than the target)
 */

export function hierarchyCheck(executor: GuildMember, target: GuildMember): boolean {
  if (executor.guild.ownerId === executor.id) return true;
  if (target.guild.ownerId === target.id) return false;
  return executor.roles.highest.comparePositionTo(target.roles.highest) > 0;
}
