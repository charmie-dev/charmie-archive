import { Events, Listener, Result } from '@sapphire/framework';
import { Message, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { Stopwatch } from '@sapphire/stopwatch';
import { isDMChannel } from '@sapphire/discord.js-utilities';

import { CharmieCommandGuildRunContext, CharmieCommandRunContext, CharmieMessageCommand } from '../Command';

import CommandManager from '../CommandManager';
import GuildCache from '../../db/GuildCache';

export class MessageCommandParser extends Listener<typeof Events.PreMessageParsed> {
  private readonly requiredPermissions = new PermissionsBitField([
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages
  ]).freeze();

  public constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.PreMessageParsed });
  }

  public async run(message: Message) {
    // Run the message parser.
    const canRun = await this.canRunInChannel(message);
    if (!canRun) return;

    let prefix: string | null | RegExp = null;
    const mentionPrefix = this.getMentionPrefix(message);
    const { client } = this.container;
    const { regexPrefix } = client.options;

    if (mentionPrefix) {
      if (message.content.length === mentionPrefix.length) {
        client.emit(Events.MentionPrefixOnly, message);
        return;
      }

      prefix = mentionPrefix;
    } else if (regexPrefix?.test(message.content)) {
      prefix = regexPrefix;
    } else {
      const prefixes = await client.fetchPrefix(message);
      const parsed = this.getPrefix(message.content, prefixes);
      if (parsed !== null) prefix = parsed;
    }

    if (prefix === null) client.emit(Events.NonPrefixedMessage, message);
    else {
      const { client, stores } = this.container;

      const commandPrefix = this.getCommandPrefix(message.content, prefix);
      const prefixLess = message.content.slice(commandPrefix.length).trim();

      const spaceIndex = prefixLess.indexOf(' ');
      const commandName = spaceIndex === -1 ? prefixLess : prefixLess.slice(0, spaceIndex);
      if (commandName.length === 0) {
        client.emit(Events.UnknownMessageCommandName, { message, prefix, commandPrefix });
        return;
      }

      const command = stores
        .get('commands')
        .get(client.options.caseInsensitiveCommands ? commandName.toLowerCase() : commandName);

      if (!command) {
        return CommandManager.checkRawMessage(message);
      }

      if (!command.messageRun) {
        client.emit(Events.CommandDoesNotHaveMessageCommandHandler, { message, prefix, commandPrefix, command });
        return;
      }

      const parameters = spaceIndex === -1 ? '' : prefixLess.substring(spaceIndex + 1).trim();

      const payload = {
        message,
        command: command as CharmieMessageCommand,
        parameters,
        context: { commandName, commandPrefix, prefix }
      };

      const globalResult = await this.container.stores
        .get('preconditions')
        .messageRun(message, command as CharmieMessageCommand, payload as any);

      if (globalResult.isErr())
        return message.client.emit(Events.MessageCommandDenied, globalResult.unwrapErr(), payload);

      // Run command-specific preconditions:
      const localResult = await command.preconditions.messageRun(
        message,
        command as CharmieMessageCommand,
        payload as any
      );
      if (localResult.isErr())
        return message.client.emit(Events.MessageCommandDenied, localResult.unwrapErr(), payload);

      const args = await command.messagePreParse(message, parameters, payload.context);

      const result = message.inGuild()
        ? await Result.fromAsync(async () => {
            message.client.emit(Events.MessageCommandRun, message, command, { ...payload, args });
            const config = await GuildCache.get(message.guildId);

            const stopwatch = new Stopwatch();
            const result = await payload.command.messageRun(message, args, {
              commandName,
              commandPrefix,
              prefix,
              config
            } as CharmieCommandGuildRunContext);
            const { duration } = stopwatch.stop();

            message.client.emit(Events.MessageCommandSuccess, { ...payload, args, result, duration });

            return duration;
          })
        : await Result.fromAsync(async () => {
            message.client.emit(Events.MessageCommandRun, message, command, { ...payload, args });

            const stopwatch = new Stopwatch();
            const result = await payload.command.messageRun(message, args, payload.context as CharmieCommandRunContext);
            const { duration } = stopwatch.stop();

            message.client.emit(Events.MessageCommandSuccess, { ...payload, args, result, duration });

            return duration;
          });

      result.inspectErr(error =>
        message.client.emit(Events.MessageCommandError, error, { ...payload, args, duration: -1 })
      );

      message.client.emit(Events.MessageCommandFinish, message, command, {
        ...payload,
        args,
        success: result.isOk(),
        duration: result.unwrapOr(-1)
      });
    }
  }

  private async canRunInChannel(message: Message): Promise<boolean> {
    if (isDMChannel(message.channel)) return true;

    const me = await message.guild?.members.fetchMe();
    if (!me) return false;

    const { channel } = message;
    const permissionsFor = channel.permissionsFor(me);
    if (!permissionsFor) return false;

    return permissionsFor.has(this.requiredPermissions, true);
  }

  private getMentionPrefix(message: Message): string | null {
    if (this.container.client.disableMentionPrefix) return null;
    // If the content is shorter than 20 characters, or does not start with `<@` then skip early:
    if (message.content.length < 20 || !message.content.startsWith('<@')) return null;

    // Calculate the offset and the ID that is being provided
    const [offset, id] =
      message.content[2] === '&'
        ? [3, message.guild?.roles.botRoleFor(this.container.client.id!)?.id]
        : [message.content[2] === '!' ? 3 : 2, this.container.client.id];

    if (!id) return null;

    const offsetWithId = offset + id.length;

    // If the mention doesn't end with `>`, skip early:
    if (message.content[offsetWithId] !== '>') return null;

    // Check whether or not the ID is the same as the managed role ID:
    const mentionId = message.content.substring(offset, offsetWithId);
    if (mentionId === id) return message.content.substring(0, offsetWithId + 1);

    return null;
  }

  private getPrefix(content: string, prefixes: readonly string[] | string | null): string | null {
    if (prefixes === null) return null;
    const { caseInsensitivePrefixes } = this.container.client.options;

    if (caseInsensitivePrefixes) content = content.toLowerCase();

    if (typeof prefixes === 'string') {
      return content.startsWith(caseInsensitivePrefixes ? prefixes.toLowerCase() : prefixes) ? prefixes : null;
    }

    return prefixes.find(prefix => content.startsWith(caseInsensitivePrefixes ? prefix.toLowerCase() : prefix)) ?? null;
  }

  private getCommandPrefix(content: string, prefix: string | RegExp): string {
    return typeof prefix === 'string' ? prefix : prefix.exec(content)![0];
  }
}
