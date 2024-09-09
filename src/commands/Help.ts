import { ApplyOptions } from '@sapphire/decorators';
import { UserOrMemberMentionRegex } from '@sapphire/discord.js-utilities';
import { reply } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';

import { CharmieCommand, CommandCategory } from '../managers/commands/Command';
import { DEFAULT_EMBED_COLOR } from '../utils/constants';
import { generateHelpFields } from '../utils';

import ConfigManager from '../managers/config/ConfigManager';

@ApplyOptions<CharmieCommand.Options>({
  category: CommandCategory.Utility,
  usage: '[command]',
  description: 'View all available commands or get help for a specific command.',
  preconditions: ['GuildOnly']
})
export default class Help extends CharmieCommand {
  private readonly _restrictedCommands = ['eval', 'e', 'ev', 'execute', 'exec', 'statistics', 'stats'];

  public async messageRun(
    message: CharmieCommand.Message<true>,
    args: CharmieCommand.Args,
    context: CharmieCommand.RunContext
  ) {
    const prefix = this.getCommandPrefix(context).replaceAll(
      `<@${this.container.client.user!.id}>`,
      message.inGuild() ? `@${message.guild.members.me!.displayName}` : `@${this.container.client.user!.tag}`
    );

    if (!args.finished) {
      const commandName = await args.pick('string');

      if (this.isRestrictedCommand(commandName, message.author.id)) throw 'That command does not exist.';

      const command = this.container.stores.get('commands').get(commandName) as CharmieCommand;
      if (!command) throw 'That command does not exist.';

      return this.displayCommandHelp(message, command, prefix);
    }

    return this.displayAllCommands(message, prefix);
  }

  private getCommandPrefix(context: CharmieCommand.RunContext): string {
    return (context.prefix instanceof RegExp && !context.commandPrefix.endsWith(' ')) ||
      UserOrMemberMentionRegex.test(context.commandPrefix)
      ? `${context.commandPrefix} `
      : context.commandPrefix;
  }

  private isRestrictedCommand(commandName: string, authorId: string): boolean {
    return this._restrictedCommands.includes(commandName) && !ConfigManager.global_config.developers.includes(authorId);
  }

  private displayCommandHelp(message: CharmieCommand.Message, command: CharmieCommand, prefix: string) {
    const embed = this.createBaseEmbed()
      .setTitle(`${command.slashOnly ? `(Slash Only) ` : ''}${command.name}`)
      .setDescription(command.description ?? 'No description provided.')
      .setFooter({ text: '<> = required, [] = optional' });

    this.formatCommandEmbedFields(message, embed, command, prefix);

    return reply(message, { embeds: [embed] });
  }

  private async displayAllCommands(message: CharmieCommand.Message, prefix: string) {
    const isDeveloper = ConfigManager.global_config.developers.includes(message.author.id);
    const devCommands = this.container.stores
      .get('commands')
      .filter(c => c.category === CommandCategory.Developer).size;
    const combined = this.container.stores.get('commands').size;

    const embed = this.createBaseEmbed()
      .setTitle('Command List')
      .setDescription(`Use \`${prefix}help <command>\` for more information on a command.`)
      .setFooter({ text: `${isDeveloper ? combined : combined - devCommands} total commands.` });

    const fields = generateHelpFields(ConfigManager.global_config, message.author.id, this.container);
    embed.setFields(fields);

    return reply(message, { embeds: [embed] });
  }

  private createBaseEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setAuthor({
        name: this.container.client.user!.username,
        iconURL: this.container.client.user!.displayAvatarURL()
      })
      .setColor(DEFAULT_EMBED_COLOR);
  }

  private formatCommandEmbedFields(message: CharmieCommand.Message, embed: EmbedBuilder, command: CharmieCommand, prefix: string): EmbedBuilder {
    const { usage, aliases } = this._getUsageAndAliases(message, prefix, command);

    if (usage) embed.addFields({ name: 'Usage', value: usage, inline: true });
    if (aliases) embed.addFields({ name: 'Aliases', value: aliases, inline: true });

    const { flags, options, permissions } = this._getAdditionalInfo(command);

    if (flags || options || permissions)
      embed.addFields({
        name: 'Additional',
        value: this._formatAdditionalInfo(flags, options, permissions)
      });

    return embed;
  }

  private _getAdditionalInfo(command: CharmieCommand): {
    flags: string | null;
    options: string | null;
    permissions: string | null;
  } {
    let flags: string | null = null;
    let options: string | null = null;
    let permissions: string | null = null;

    if (command.mappedFlags.length > 0)
      flags = command.mappedFlags.map(flag => `\`${flag.name} (${flag.aliases.join(', ')})\``).join(', ');

    if (command.mappedOptions.length > 0)
      options = command.mappedOptions.map(option => `\`${option.name} (${option.aliases.join(', ')})\``).join(', ');

    if (command.options.requiredUserPermissions)
      permissions = new PermissionsBitField(command.options.requiredUserPermissions)
        .toArray()
        .map(permission => `\`${permission}\``)
        .join('`, `')
        .replace(/([a-z])([A-Z])/g, '$1 $2');

    return { flags, options, permissions };
  }

  private _getUsageAndAliases(
    message: CharmieCommand.Message,
    prefix: string,
    command: CharmieCommand
  ): { usage: string | null; aliases: string | null } {
    let usage: string | null = null;
    let aliases: string | null = null;

    if (command.usage) {
      if (typeof command.usage === 'string') {
        usage = `\`${prefix}${command.name} ${command.usage}\``;
      } else if (Array.isArray(command.usage)) {
        usage = command.usage.map(usage => `\`${prefix}${command.name} ${usage}\``).join('\n');
      }
        usage!.replaceAll(
      `<@${this.container.client.user!.id}>`,
      message.inGuild() ? `@${message.guild.members.me!.displayName}` : `@${this.container.client.user!.tag}`
    );
    }

    if (command.aliases.length > 0) aliases = command.aliases.map(a => `\`${a}\``).join(', ');

    return { usage, aliases };
  }

  private _formatAdditionalInfo(flags: string | null, options: string | null, permissions: string | null): string {
    return `${permissions ? `Permissions: ${permissions}` : ''}${flags ? `\nFlags: ${flags}` : ''}${
      options ? `\nOptions: ${options}` : ''
    }`;
  }
}
