import { ApplyOptions } from '@sapphire/decorators';
import { reply } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder } from '@discordjs/builders';

import ms from 'ms';

import { CharmieCommand, CommandCategory } from '../managers/commands/Command';
import { DEFAULT_EMBED_COLOR } from '../utils/constants';

@ApplyOptions<CharmieCommand.Options>({
  category: CommandCategory.Management,
  description: 'Configure the bot.',
  aliases: ['settings'],
  usage: '<group> <subcommand> <...options>',
  requiredUserPermissions: 'Administrator'
})
export default class Config extends CharmieCommand {
  public async messageRun(
    message: CharmieCommand.Message<true>,
    args: CharmieCommand.Args,
    context: CharmieCommand.GuildRunContext
  ) {
    if (args.finished) throw 'You must provide the name of a subcommand or subcommand group.';

    const group = await args.pick('string').catch(() => {
      throw 'Invalid subcommand group.';
    });

    if (!ConfigCommandGroups.includes(group))
      throw `Invalid subcommand group. The valid groups are ${ConfigCommandGroups.map(group => `\`${group}\``).join(
        ', '
      )}.`;

    switch (group) {
      case ConfigSubcommandGroup.Commands: {
        if (args.finished) throw 'You must provide the name of a subcommand for the `commands` group.';

        const subcommand = await args.pick('string').catch(() => {
          throw 'Invalid subcommand.';
        });

        if (!ConfigCommandCmdGroupSubcommands.includes(subcommand))
          throw `Invalid subcommand. The valid subcommands are ${ConfigCommandCmdGroupSubcommands.map(
            subcmd => `\`${subcmd}\``
          ).join(', ')}.`;

        switch (subcommand) {
          case ConfigSubcommand.Prefix: {
            if (args.finished)
              return reply(message, `The current prefix for this server is \`${context.config.msgCmdsPrefix}\`.`);

            const prefix = await args.pick('string').catch(() => {
              throw 'Invalid prefix.';
            });

            if (prefix === context.config.msgCmdsPrefix)
              throw `The new prefix must be different from the current prefix (\`${context.config.msgCmdsPrefix}\`).`;
            if (prefix.length > 10) throw 'The new prefix must be less than 10 characters in length.';
            if (prefix.length < 1) throw 'The new prefix must be at least 1 character in length.';

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsPrefix: prefix }
            });

            return reply(message, `The \`prefix\` for this server has been updated to \`${prefix}\`.`);
          }

          case ConfigSubcommand.AutoDelete: {
            if (args.finished)
              return reply(
                message,
                `The current setting for this server is set to \`${context.config.msgCmdsAutoDelete}\`.`
              );

            const value = await args.pick('boolean').catch(() => {
              throw 'Invalid boolean value.';
            });

            if (value === context.config.msgCmdsAutoDelete)
              throw `The new auto-delete setting must be different from the current setting (\`${context.config.msgCmdsAutoDelete}\`).`;

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsAutoDelete: value }
            });

            return reply(message, `The \`auto-delete\` setting for this server has been updated to \`${value}\`.`);
          }

          case ConfigSubcommand.RespondIfNoPerms: {
            if (args.finished)
              return reply(
                message,
                `The current setting for this server is set to \`${context.config.msgCmdsRespondIfNoPerms}\`.`
              );

            const value = await args.pick('boolean').catch(() => {
              throw 'Invalid boolean value.';
            });

            if (value === context.config.msgCmdsRespondIfNoPerms)
              throw `The new setting must be different from the current setting (\`${context.config.msgCmdsRespondIfNoPerms}\`).`;

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsRespondIfNoPerms: value }
            });

            return reply(
              message,
              `The \`respond-if-no-permission\` setting for this server has been updated to \`${value}\`.`
            );
          }

          case ConfigSubcommand.RespondIfDisabled: {
            if (args.finished)
              return reply(
                message,
                `The current setting for this server is set to \`${context.config.msgCmdsRespondIfDisabled}\`.`
              );

            const value = await args.pick('boolean').catch(() => {
              throw 'Invalid boolean value.';
            });

            if (value === context.config.msgCmdsRespondIfDisabled)
              throw `The new setting must be different from the current setting (\`${context.config.msgCmdsRespondIfDisabled}\`).`;

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsRespondIfDisabled: value }
            });

            return reply(
              message,
              `The \`respond-if-disabled\` setting for this server has been updated to \`${value}\`.`
            );
          }

          case ConfigSubcommand.RespondIfNotInAllowedChannel: {
            if (args.finished)
              return reply(
                message,
                `The current setting for this server is set to \`${context.config.msgCmdsRespondIfNotAllowed}\`.`
              );

            const value = await args.pick('boolean').catch(() => {
              throw 'Invalid boolean value.';
            });

            if (value === context.config.msgCmdsRespondIfNotAllowed)
              throw `The new setting must be different from the current setting (\`${context.config.msgCmdsRespondIfNotAllowed}\`).`;

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsRespondIfNotAllowed: value }
            });

            return reply(
              message,
              `The \`respond-if-not-in-allowed-channel\` setting for this server has been updated to \`${value}\`.`
            );
          }

          case ConfigSubcommand.PreserveErrors: {
            if (args.finished)
              return reply(
                message,
                `The current setting for this server is set to \`${context.config.msgCmdsPreserveErrors}\`.`
              );

            const value = await args.pick('boolean').catch(() => {
              throw 'Invalid boolean value.';
            });

            if (value === context.config.msgCmdsPreserveErrors)
              throw `The new setting must be different from the current setting (\`${context.config.msgCmdsPreserveErrors}\`).`;

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsPreserveErrors: value }
            });

            return reply(message, `The \`preserve-errors\` setting for this server has been updated to \`${value}\`.`);
          }

          case ConfigSubcommand.ShowExecutor: {
            if (args.finished)
              return reply(
                message,
                `The current setting for this server is set to \`${context.config.msgCmdsShowExecutor}\`.`
              );

            const value = await args.pick('boolean').catch(() => {
              throw 'Invalid boolean value.';
            });

            if (value === context.config.msgCmdsShowExecutor)
              throw `The new setting must be different from the current setting (\`${context.config.msgCmdsShowExecutor}\`).`;

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsShowExecutor: value }
            });

            return reply(message, `The \`show-executor\` setting for this server has been updated to \`${value}\`.`);
          }

          case ConfigSubcommand.ErrorDeleteDelay: {
            if (args.finished)
              return reply(
                message,
                `The current setting for this server is set to \`${ms(context.config.msgCmdsErrorDeleteDelay, {
                  long: true
                })}\`.`
              );

            const duration = await args.pick('duration').catch(() => {
              throw 'Invalid duration value.';
            });

            if (duration === context.config.msgCmdsErrorDeleteDelay)
              throw `The new setting must be different from the current setting (\`${ms(
                context.config.msgCmdsErrorDeleteDelay,
                {
                  long: true
                }
              )}\`).`;

            if (duration === 'permanent' || duration === 0) throw 'You cannot set the error delete delay to permanent.';
            if ((duration as number) < 1000) throw 'The error delete delay cannot be less than 1 second.';
            if ((duration as number) > 30000) throw 'The error delete delay cannot be longer than 30 seconds.';

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsErrorDeleteDelay: duration as number }
            });

            return reply(
              message,
              `The \`error-delete-delay\` setting for this server has been updated to \`${ms(duration as number, {
                long: true
              })}\`.`
            );
          }

          case ConfigSubcommand.Disable: {
            const disabledShortcuts = await this.container.db.commands.findMany({
              where: { guildId: message.guildId, enabled: false }
            });

            const disabledCommands = context.config.msgCmdsDisabledList;

            if (args.finished) {
              const embed = new EmbedBuilder().setColor(DEFAULT_EMBED_COLOR).setFields([
                {
                  name: 'Disabled Built-In Commands',
                  value: disabledCommands.length ? disabledCommands.map(c => `\`${c}\``).join(', ') : 'None'
                },
                {
                  name: 'Disabled Shortcut Commands',
                  value: disabledShortcuts.length ? disabledShortcuts.map(c => `\`${c.name}\``).join(', ') : 'None'
                }
              ]);

              return reply(message, { embeds: [embed] });
            }

            const commandName = await args.pick('string').catch(() => {
              throw 'Invalid command or shortcut name.';
            });

            const command = this.container.stores.get('commands').get(commandName);
            const shortcut = await this.container.db.commands.findUnique({
              where: { guildId_name: { guildId: message.guildId, name: commandName } }
            });
            if (!command) {
              if (!shortcut) throw 'That command or shortcut does not exist.';

              if (!shortcut.enabled) throw 'That shortcut is already disabled.';

              await this.container.db.commands.update({
                where: { guildId_name: { guildId: message.guildId, name: shortcut.name } },
                data: { enabled: false }
              });

              return reply(message, { content: `The \`${commandName}\` shortcut has been disabled.`, embeds: [] });
            }

            if (command.category === CommandCategory.Developer) throw 'That command or shortcut does not exist.';
            if (command.name === this.name) throw 'You cannot disable the config command.';
            if (context.config.msgCmdsDisabledList.includes(command.name)) throw 'That command is already disabled.';

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsDisabledList: { push: command.name } }
            });

            return reply(message, `The \`${command.name}\` command has been disabled.`);
          }

          case ConfigSubcommand.Enable: {
            if (args.finished) throw 'You must specify a command or shortcut to enable.';

            const commandName = await args.pick('string').catch(() => {
              throw 'Invalid command or shortcut name.';
            });

            const command = this.container.stores.get('commands').get(commandName);
            const shortcut = await this.container.db.commands.findUnique({
              where: { guildId_name: { guildId: message.guildId, name: commandName } }
            });

            if (!command) {
              if (!shortcut) throw 'That command or shortcut does not exist.';

              if (shortcut.enabled) throw 'That shortcut is already enabled.';

              await this.container.db.commands.update({
                where: { guildId_name: { guildId: message.guildId, name: shortcut.name } },
                data: { enabled: true }
              });

              return reply(message, `The \`${shortcut.name}\` shortcut has been enabled.`);
            }

            if (command.category === CommandCategory.Developer) throw 'That command or shortcut does not exist.';
            if (!context.config.msgCmdsDisabledList.includes(command.name)) throw 'That command is already enabled.';

            context.config.msgCmdsDisabledList.splice(context.config.msgCmdsDisabledList.indexOf(command.name), 1);

            await this.container.db.guilds.update({
              where: { id: message.guildId },
              data: { msgCmdsDisabledList: context.config.msgCmdsDisabledList }
            });

            return reply(message, `The \`${command.name}\` command has been enabled.`);
          }
        }
      }
    }
  }
}

enum ConfigSubcommandGroup {
  Commands = 'commands'
}

enum ConfigSubcommand {
  Prefix = 'prefix',
  AutoDelete = 'auto-delete',
  RespondIfNoPerms = 'respond-if-no-perms',
  RespondIfDisabled = 'respond-if-disabled',
  RespondIfNotInAllowedChannel = 'respond-if-not-in-allowed-channel',
  PreserveErrors = 'preserve-errors',
  ShowExecutor = 'show-executor',
  ErrorDeleteDelay = 'error-delete-delay',
  Disable = 'disable',
  Enable = 'enable'
}

const ConfigCommandGroups: string[] = ['commands'];
const ConfigCommandCmdGroupSubcommands: string[] = [
  'prefix',
  'auto-delete',
  'respond-if-no-perms',
  'respond-if-disabled',
  'respond-if-not-in-allowed-channel',
  'preserve-errors',
  'show-executor',
  'error-delete-delay',
  'disable',
  'enable'
];
