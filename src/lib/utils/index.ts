import YAML from 'yaml';
import fs from 'node:fs';
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
  ContextMenuCommandInteraction,
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

import { container } from '@sapphire/framework';
import { reply, send } from '@sapphire/plugin-editable-commands';

import { GuildConfig } from '../managers/config/schema';
import { COMMON_STAFF_PERMISSIONS, MODERATION_COMMANDS } from './commands';

import Logger from './logger';

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
 * Throws an error in the form of an embed.
 *
 * @param message The message, or interaction to send the error to
 * @param error The error message
 * @param preserve Whether to preserve the error message (cannot be applied to interactions)
 * @param delay How long  to wait before deleting the error message (cannot be applied to interactions)
 *
 * @returns unkown
 */

export async function embeddedError(
  message:
    | Message
    | ChatInputCommandInteraction
    | ButtonInteraction
    | ContextMenuCommandInteraction
    | ModalSubmitInteraction,
  error: string,
  preserve: boolean = false,
  delay: number = 7500
): Promise<unknown> {
  if (message instanceof Message) {
    const errorMsg = await sendOrReply(message, {
      embeds: [{ description: error, color: Colors.Red }]
    });

    if (!preserve) {
      setTimeout(() => {
        errorMsg.delete().catch(() => {});
        message.delete().catch(() => {});
      }, delay);
    }
  } else if (
    message instanceof ChatInputCommandInteraction ||
    message instanceof ModalSubmitInteraction ||
    message instanceof ButtonInteraction ||
    message instanceof ContextMenuCommandInteraction
  ) {
    if (!message.deferred && !message.replied)
      return message.reply({
        embeds: [{ description: `${error}`, color: Colors.Red }],
        ephemeral: true
      });
    else
      return message.editReply({
        embeds: [{ description: `${error}`, color: Colors.Red }]
      });
  }
}

/**
 * Attempts to reply to a message, or send a message if the message is not available to be replied to.
 *
 * @param message The message to reply to
 * @param content The content to send (or message create options)
 *
 * @returns {@link Message} The message that was sent
 */

export async function sendOrReply(message: Message, content: string | MessageCreateOptions): Promise<Message> {
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

export function permissionsCheck(member: GuildMember, guild: Guild, config: GuildConfig): boolean {
  if (member.id === guild.ownerId) return true;
  if (member.permissions.any(COMMON_STAFF_PERMISSIONS, true)) return true;
  if (config.moderators.some(role => member.roles.cache.has(role))) return true;

  const { overrides } = config.commands;
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
