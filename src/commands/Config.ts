import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

import ms from 'ms';

import { CharmieCommand, CommandCategory } from '@managers/commands/Command';
import { parseDuration } from '@utils/index';

import GuildCache from '@managers/db/GuildCache';

@ApplyOptions<CharmieCommand.Options>({
  category: CommandCategory.Management,
  description: 'Configure the bot.',
  aliases: ['settings'],
  usage: '<group> <subcommand> <...options>',
  requiredUserPermissions: 'Administrator',
  slashOnly: true
})
export default class Config extends CharmieCommand {
  public async messageRun() {
    throw 'This command does not have a message command implementation. Please use `/config` instead.';
  }

  public registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(command =>
      command
        .setName('config')
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommandGroup(group =>
          group
            .setName(ConfigSubcommandGroup.Commands)
            .setDescription('Command related settings.')
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.Prefix)
                .setDescription('Change or view the prefix for this server.')
                .addStringOption(opt =>
                  opt
                    .setName('new-prefix')
                    .setDescription('The new prefix to use.')
                    .setRequired(false)
                    .setMinLength(1)
                    .setMaxLength(10)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.AutoDelete)
                .setDescription('Whether to automatically delete the message that triggers a command.')
                .addBooleanOption(opt =>
                  opt.setName('value').setDescription('The value for this setting.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.RespondIfNoPerms)
                .setDescription(
                  'Whether to respond to users if they try to run a command without the required permissions.'
                )
                .addBooleanOption(opt =>
                  opt.setName('value').setDescription('The value for this setting.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.RespondIfDisabled)
                .setDescription('Whether to respond to users if they try to run a disabled command.')
                .addBooleanOption(opt =>
                  opt.setName('value').setDescription('The value for this setting.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.RespondIfDisabledInChannel)
                .setDescription(
                  'Whether to respond to users if they try to run a command in channel where it is disabled.'
                )
                .addBooleanOption(opt =>
                  opt.setName('value').setDescription('The value for this setting.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.PreserveErrors)
                .setDescription('Whether to preserve errors sent by the bot.')
                .addBooleanOption(opt =>
                  opt.setName('value').setDescription('The value for this setting.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.ErrorDeleteDelay)
                .setDescription('The delay before deleting the error messages sent by the bot.')
                .addStringOption(opt =>
                  opt.setName('duration').setDescription('The duration of the delay.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.ShowExecutor)
                .setDescription('Whether to show the executor of a command in the embed.')
                .addBooleanOption(opt =>
                  opt.setName('value').setDescription('The value for this setting.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.Enable)
                .setDescription('Enable a command.')
                .addStringOption(opt =>
                  opt.setName('command').setDescription('The command to enable.').setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName(ConfigSubcommand.Disable)
                .setDescription('Disable a command.')
                .addStringOption(opt =>
                  opt.setName('command').setDescription('The command to disable.').setRequired(true)
                )
            )
        )
    );
  }

  public async chatInputRun(interaction: CharmieCommand.ChatInputCommandInteraction<'cached'>) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply({ ephemeral: true });
    const config = await GuildCache.get(interaction.guildId);

    switch (subcommandGroup) {
      case ConfigSubcommandGroup.Commands: {
        switch (subcommand) {
          case ConfigSubcommand.Prefix: {
            const prefix = interaction.options.getString('new-prefix', false);

            if (!prefix) {
              return interaction.editReply(`The current prefix for this server is \`${config.msgCmdsPrefix}\`.`);
            }

            if (prefix === config.msgCmdsPrefix) throw 'The prefix you provided is the same as the current prefix.';

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsPrefix: prefix }
            });

            return interaction.editReply(`The prefix for this server has been set to \`${prefix}\`.`);
          }

          case ConfigSubcommand.AutoDelete: {
            const value = interaction.options.getBoolean('value', true);

            if (config.msgCmdsAutoDelete === value) throw `The value for this setting is already set to \`${value}\`.`;

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsAutoDelete: value }
            });

            return interaction.editReply(`The value for this setting has been set to \`${value}\`.`);
          }

          case ConfigSubcommand.RespondIfNoPerms: {
            const value = interaction.options.getBoolean('value', true);

            if (config.msgCmdsRespondIfNoPerms === value)
              throw `The value for this setting is already set to \`${value}\`.`;

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsRespondIfNoPerms: value }
            });

            return interaction.editReply(`The value for this setting has been set to \`${value}\`.`);
          }

          case ConfigSubcommand.RespondIfDisabled: {
            const value = interaction.options.getBoolean('value', true);

            if (config.msgCmdsRespondIfDisabled === value)
              throw `The value for this setting is already set to \`${value}\`.`;

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsRespondIfDisabled: value }
            });

            return interaction.editReply(`The value for this setting has been set to \`${value}\`.`);
          }

          case ConfigSubcommand.RespondIfDisabledInChannel: {
            const value = interaction.options.getBoolean('value', true);

            if (config.msgCmdsRespondIfNotAllowed === value)
              throw `The value for this setting is already set to \`${value}\`.`;

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsRespondIfNotAllowed: value }
            });

            return interaction.editReply(`The value for this setting has been set to \`${value}\`.`);
          }

          case ConfigSubcommand.PreserveErrors: {
            const value = interaction.options.getBoolean('value', true);

            if (config.msgCmdsPreserveErrors === value)
              throw `The value for this setting is already set to \`${value}\`.`;

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsPreserveErrors: value }
            });

            return interaction.editReply(`The value for this setting has been set to \`${value}\`.`);
          }

          case ConfigSubcommand.ShowExecutor: {
            const value = interaction.options.getBoolean('value', true);

            if (config.msgCmdsShowExecutor === value)
              throw `The value for this setting is already set to \`${value}\`.`;

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsShowExecutor: value }
            });

            return interaction.editReply(`The value for this setting has been set to \`${value}\`.`);
          }

          case ConfigSubcommand.ErrorDeleteDelay: {
            const uDuration = interaction.options.getString('duration', true);

            const duration = parseDuration(uDuration);
            if (isNaN(duration)) throw 'Invalid duration.';

            if (config.msgCmdsErrorDeleteDelay === duration)
              throw `The value for this setting is already set to \`${ms(duration, { long: true })}\`.`;

            if (duration === 0) throw 'You cannot set the error delete delay to permanent.';
            if (duration < 1000) throw 'The error delete delay cannot be less than 1 second.';
            if (duration > 30000) throw 'The error delete delay cannot be longer than 30 seconds.';

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsErrorDeleteDelay: duration }
            });

            return interaction.editReply(
              `The value for this setting has been set to \`${ms(duration, { long: true })}\`.`
            );
          }

          case ConfigSubcommand.Enable: {
            const commandName = interaction.options.getString('command', true);

            const command = this.container.stores.get('commands').get(commandName);
            const customCommand = await this.container.db.commands.findUnique({
              where: { guildId_name: { guildId: interaction.guildId, name: commandName } }
            });

            if (!command) {
              if (!customCommand) throw 'That command or shortcut does not exist.';
              if (customCommand.enabled) throw 'That shortcut is already enabled.';

              await this.container.db.commands.update({
                where: { guildId_name: { guildId: interaction.guildId, name: commandName } },
                data: { enabled: true }
              });

              return interaction.editReply(`The shortcut \`${commandName}\` has been enabled.`);
            }

            if (command.category === CommandCategory.Developer) throw 'That command or shortcut does not exist.';
            if (!config.msgCmdsDisabledList.includes(command.name)) throw 'That command is already enabled.';

            config.msgCmdsDisabledList.splice(config.msgCmdsDisabledList.indexOf(command.name), 1);

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsDisabledList: config.msgCmdsDisabledList }
            });

            return interaction.editReply(`The \`${command.name}\` command has been enabled.`);
          }

          case ConfigSubcommand.Disable: {
            const commandName = interaction.options.getString('command', true);

            const command = this.container.stores.get('commands').get(commandName);
            const customCommand = await this.container.db.commands.findUnique({
              where: { guildId_name: { guildId: interaction.guildId, name: commandName } }
            });

            if (!command) {
              if (!customCommand) throw 'That command or shortcut does not exist.';

              if (!customCommand.enabled) throw 'That shortcut is already disabled.';

              await this.container.db.commands.update({
                where: { guildId_name: { guildId: interaction.guildId, name: commandName } },
                data: { enabled: false }
              });

              return interaction.editReply(`The shortcut \`${commandName}\` has been disabled.`);
            }

            if (command.category === CommandCategory.Developer) throw 'That command or shortcut does not exist.';
            if (command.name === this.name) throw 'You cannot disable the config command.';
            if (config.msgCmdsDisabledList.includes(command.name)) throw 'That command is already disabled.';

            await this.container.db.guilds.update({
              where: { id: interaction.guildId },
              data: { msgCmdsDisabledList: { push: command.name } }
            });

            return interaction.editReply(`The \`${command.name}\` command has been disabled.`);
          }
        }
      }
    }
  }
}

enum ConfigSubcommandGroup {
  Commands = 'commands',
  Logging = 'logging'
}

enum ConfigSubcommand {
  Prefix = 'prefix',
  AutoDelete = 'auto-delete',
  RespondIfNoPerms = 'respond-if-no-perms',
  RespondIfDisabled = 'respond-if-disabled',
  RespondIfDisabledInChannel = 'respond-if-disabled-in-channel',
  PreserveErrors = 'preserve-errors',
  ShowExecutor = 'show-executor',
  ErrorDeleteDelay = 'error-delete-delay',
  Disable = 'disable',
  Enable = 'enable',
  SetChannel = 'set-channel'
}
