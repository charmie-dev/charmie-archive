import { Message } from 'discord.js';
import { container, Events } from '@sapphire/framework';

import {
  MessageCommandError,
  MessageCommandDenied,
  MessageCommandParsed,
  ChatInputCommandError,
  ChatInputCommandDenied
} from './CommandHandlers';
import { capitalize } from '@utils/index';

import GuildCache from '../db/GuildCache';
import Logger from '@utils/logger';

export default class CommandManager {
  private static listeners: ListenerConfig[] = [
    { name: Events.MessageCommandError, piece: MessageCommandError },
    { name: Events.MessageCommandDenied, piece: MessageCommandDenied },
    { name: 'CorePreMessageParser', piece: MessageCommandParsed },
    { name: Events.ChatInputCommandError, piece: ChatInputCommandError },
    { name: Events.ChatInputCommandDenied, piece: ChatInputCommandDenied }
  ];

  public static checkRawMessage(message: Message) {
    if (!message.inGuild() || message.author.bot || message.webhookId || !message.content) return;
    return CommandManager.parseRawMessage(message);
  }

  public static async parseRawMessage(message: Message<true>) {
    const { msgCmdsPrefix } = await GuildCache.get(message.guildId);

    let usedPrefix = msgCmdsPrefix;

    const mentionRegex = new RegExp(`^<@!?${message.client.user.id}>`);
    const { regexPrefix } = container.client.options;

    if (
      !message.content.startsWith(usedPrefix) &&
      !mentionRegex.test(message.content) &&
      !(regexPrefix && regexPrefix.test(message.content))
    )
      return;

    if (mentionRegex.test(message.content)) usedPrefix = mentionRegex.exec(message.content)![0] + ' ';
    else if (regexPrefix && regexPrefix.test(message.content)) usedPrefix = regexPrefix.exec(message.content)![0];

    const args = message.content.slice(usedPrefix.length).split(' ');
    const name = args[0].toLowerCase();
    args.shift();

    let command = await container.db.commands.findUnique({
      where: { guildId_name: { guildId: message.guildId, name } }
    });

    if (!command) return;
  }

  public static async mountListeners() {
    const mountPromises = this.listeners.map(listener => this.mountListener(listener));
    await Promise.all(mountPromises);
  }

  private static async mountListener({ name, piece }: ListenerConfig) {
    await container.stores.loadPiece({ store: 'listeners', name, piece });
    const capitalizedName = name === 'CorePreMessageParser' ? Events.PreMessageParsed : name;
    Logger.info(`Mounted command listener "${capitalize(capitalizedName)}"`);
  }
}

interface ListenerConfig {
  name: string;
  piece: any;
}
