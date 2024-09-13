import { Message } from 'discord.js';
import { container } from '@sapphire/framework';

import { ListenerPieces } from './listeners';
import { ArgumentPieces } from './arguments';
import { PreconditionPieces } from './preconditions';

import GuildCache from '../db/GuildCache';

export default class CommandManager {
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

  public static async loadListeners() {
    const mountPromises = ListenerPieces.map(listener => this.loadListener(listener));
    await Promise.all(mountPromises);
  }

  private static async loadListener({ name, piece }: ListenerConfig) {
    await container.stores.loadPiece({ store: 'listeners', name, piece });
  }

  public static async loadPreconditions() {
    const mountPromises = PreconditionPieces.map(precondition => this.loadPrecondition(precondition));
    await Promise.all(mountPromises);
  }

  private static async loadPrecondition({ name, piece }: PreconditionConfig) {
    await container.stores.loadPiece({ store: 'preconditions', name, piece });
  }

  public static async loadArguments() {
    const mountPromises = ArgumentPieces.map(argument => this.loadArgument(argument));
    await Promise.all(mountPromises);
  }

  private static async loadArgument({ name, piece }: ArgumentConfig) {
    await container.stores.loadPiece({ store: 'arguments', name: name.toLowerCase(), piece });
  }
}

export interface ListenerConfig {
  name: string;
  piece: any;
}

export interface PreconditionConfig {
  name: string;
  piece: any;
}

export interface ArgumentConfig {
  name: string;
  piece: any;
}
