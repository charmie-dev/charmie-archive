import { ApplyOptions } from '@sapphire/decorators';
import { UserOrMemberMentionRegex } from '@sapphire/discord.js-utilities';
import { reply } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';

import { CharmieCommand, CommandCategory } from '../lib/charmie/Command';
import { DEFAULT_EMBED_COLOR } from '../lib/utils/constants';
import { generateHelpFields } from '../lib/utils';

import ConfigManager from '../lib/managers/config/ConfigManager';

@ApplyOptions<CharmieCommand.Options>({
  ctx: CommandCategory.Utility,
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
      '<@1272985906781098124>',
      message.inGuild() ? `@${message.guild.members.me!.displayName}` : `@${this.container.client.user!.tag}`
    );

    if (!args.finished) {
      const commandName = await args.pick('string');

      if (this.isRestrictedCommand(commandName, message.author.id)) throw 'That command does not exist.';

      const command = this.container.stores.get('commands').get(commandName) as CharmieCommand;
      if (!command) 'That command does not exist.';

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
      .setTitle(command.name)
      .setDescription(command.description ?? 'No description provided.')
      .setFooter({ text: '<> = required, [] = optional' });

    this.formatCommandEmbedFields(embed, command, prefix);

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
    embed.addFields(fields);

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

  private formatCommandEmbedFields(embed: EmbedBuilder, command: CharmieCommand, prefix: string): EmbedBuilder {
    if (command.usage) {
      if (typeof command.usage === 'string') {
        embed.addFields({ name: 'Usage', value: `\`${prefix}${command.name} ${command.usage}\`` });
      } else if (Array.isArray(command.usage)) {
        embed.addFields({
          name: 'Usage',
          value: `${command.usage.map(usage => `\`${prefix}${command.name} ${usage}\``).join('\n')}\n`
        });
      }
    }

    if (command.aliases.length > 0)
      embed.addFields({ name: 'Aliases', value: `${command.aliases.map(a => `\`${a}\``).join(', ')}` });

    if (command.options.requiredUserPermissions || command.mappedFlags.length > 0 || command.mappedOptions.length > 0)
      embed.addFields({
        name: 'Additional',
        value: `${
          command.options.requiredUserPermissions
            ? `Permission(s): ${new PermissionsBitField(command.options.requiredUserPermissions)
                .toArray()
                .join('`, `')
                .replace(/([a-z])([A-Z])/g, '$1 $2')}`
            : ``
        }${
          command.mappedFlags.length > 0
            ? `\nFlags: ${command.mappedFlags.map(flag => `\`${flag.name} (${flag.aliases.join(', ')})\``).join(', ')}`
            : ``
        }${
          command.mappedOptions.length > 0
            ? `\nOptions: ${command.mappedOptions
                .map(option => `\`${option.name} (${option.aliases.join(', ')})\``)
                .join(', ')}`
            : ``
        }`
      });
    return embed;
  }
}
