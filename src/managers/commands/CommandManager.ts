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

  public static async mount() {
    const listenerPromises = ListenerPieces.map(listener => this.loadPiece(listener));
    const preconditionPromises = PreconditionPieces.map(precondition => this.loadPiece(precondition));
    const argumentPromises = ArgumentPieces.map(argument => this.loadPiece(argument));

    await Promise.all([...listenerPromises, ...preconditionPromises, ...argumentPromises]);
  }

  public static async loadPiece({ store, name, piece }: PieceConfig) {
    await container.stores.loadPiece({ store, name: store === 'arguments' ? name.toLowerCase() : name, piece });
  }
}

export interface PieceConfig {
  store: 'listeners' | 'preconditions' | 'arguments';
  name: string;
  piece: any;
}
