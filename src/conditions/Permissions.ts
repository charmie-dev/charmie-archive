import { ApplyOptions } from '@sapphire/decorators';
import { Precondition } from '@sapphire/framework';
import { GuildTextBasedChannel, PermissionFlagsBits, PermissionsBitField, type Message } from 'discord.js';

import { CommandChannelOverride, CommandRoleOverride } from '../managers/config/schema';
import { CharmieMessageCommand, CommandCategory } from '../managers/commands/Command';
import { DM_CHANNEL_PERMISSIONS, ERROR_MESSAGES, PRECONDITION_IDENTIFIERS } from '../utils/constants';

import GuildCache from '../managers/db/GuildCache';

@ApplyOptions<Precondition.Options>({ position: 20 })
export default class PermissionsPrecondition extends Precondition {
  public async messageRun(message: Message, command: CharmieMessageCommand) {
    if (this.shouldSkipChecks(message, command)) return this.ok();

    const requiredPermissions = new PermissionsBitField(command.options.requiredUserPermissions);

    const userPermissionsResult = await this.checkUserPermissions(
      message as Message<true>,
      command,
      requiredPermissions
    );
    if (userPermissionsResult.isErr()) return userPermissionsResult;

    return this.checkChannelPermissions(message as Message<true>, command);
  }

  private shouldSkipChecks(message: Message, command: CharmieMessageCommand): boolean {
    return command.category === CommandCategory.Developer || !message.inGuild();
  }

  private async checkUserPermissions(
    message: Message<true>,
    command: CharmieMessageCommand,
    requiredPermissions: PermissionsBitField
  ): Promise<Precondition.Result> {
    if (requiredPermissions.bitfield === 0n || this.hasAdminPrivileges(message)) return this.ok();

    const availablePermissions = this.getAvailablePermissions(message);
    if (!availablePermissions) return this.unresolvablePermissionsError();

    if (this.hasRequiredPermissions(requiredPermissions, availablePermissions)) return this.ok();

    return this.checkRoleOverrides(message, command);
  }

  private getAvailablePermissions(message: Message<true>): PermissionsBitField | null {
    const channel = message.channel as GuildTextBasedChannel;
    return message.guild ? channel.permissionsFor(message.author) : DM_CHANNEL_PERMISSIONS;
  }

  private hasRequiredPermissions(required: PermissionsBitField, available: PermissionsBitField): boolean {
    return (BigInt(available.bitfield) & BigInt(required.bitfield)) === BigInt(required.bitfield);
  }

  private async checkRoleOverrides(
    message: Message<true>,
    command: CharmieMessageCommand
  ): Promise<Precondition.Result> {
    const overrides = await this.getRoleOverrides(message.guildId);
    if (overrides.length === 0) return this.noPermissionsError();

    const sortedRoleIds = this.getSortedRoleIds(message);

    for (const roleId of sortedRoleIds) {
      const override = overrides.find(o => o.id === roleId);
      if (this.isValidOverride(override, command, message)) return this.ok();
    }

    return this.noPermissionsError();
  }

  private async getRoleOverrides(guildId: string): Promise<CommandRoleOverride[]> {
    const { msgCmdsRoleOverrides } = await GuildCache.get(guildId);
    return msgCmdsRoleOverrides as CommandRoleOverride[];
  }

  private getSortedRoleIds(message: Message<true>): string[] {
    const roles = message.member!.roles.cache;
    return [...roles.keys()].sort((a, b) => roles.get(b)!.position - roles.get(a)!.position);
  }

  private isValidOverride(
    override: CommandRoleOverride | undefined,
    command: CharmieMessageCommand,
    message: Message<true>
  ): boolean {
    return !!(
      override &&
      override.commands.includes(command.name) &&
      !override.excluded.some(role => message.member!.roles.cache.has(role))
    );
  }

  private async checkChannelPermissions(
    message: Message<true>,
    command: CharmieMessageCommand
  ): Promise<Precondition.Result> {
    if (this.hasAdminPrivileges(message)) return this.ok();

    const channelOverride = await this.getChannelOverride(message);
    if (!this.isAllowed(channelOverride, command)) return this.commandDisabledError();

    if (channelOverride!.roles.length > 0 && !this.hasAllowedRole(message, channelOverride!)) {
      return this.commandDisabledError();
    }

    return this.ok();
  }

  private async getChannelOverride(message: Message<true>): Promise<CommandChannelOverride | null> {
    const { msgCmdsChannelOverrides } = await GuildCache.get(message.guildId);
    return this.findRelevantChannelOverride(message, msgCmdsChannelOverrides as CommandChannelOverride[]);
  }

  private findRelevantChannelOverride(
    message: Message<true>,
    channels: CommandChannelOverride[]
  ): CommandChannelOverride | null {
    return (
      channels.find(
        ac =>
          ac.id === message.channel.id ||
          ac.id === message.channel.parentId ||
          ac.id === message.channel.parent?.parentId
      ) || null
    );
  }

  private hasAdminPrivileges(message: Message): boolean {
    return (
      message.member!.permissions.has(PermissionFlagsBits.Administrator) || message.author.id === message.guild!.ownerId
    );
  }

  private isAllowed(channelOverride: CommandChannelOverride | null, command: CharmieMessageCommand): boolean {
    return channelOverride?.commands.includes(command.name) ?? false;
  }

  private hasAllowedRole(message: Message<true>, channelOverride: CommandChannelOverride): boolean {
    return channelOverride.roles.some(role => message.member!.roles.cache.has(role));
  }

  private unresolvablePermissionsError(): Precondition.Result {
    return this.error({
      identifier: PRECONDITION_IDENTIFIERS.NoPermissions,
      message: `I cannot resolve your permissions in this channel. Please try again later.`
    });
  }

  private noPermissionsError(): Precondition.Result {
    return this.error({
      identifier: PRECONDITION_IDENTIFIERS.NoPermissions,
      message: ERROR_MESSAGES[PRECONDITION_IDENTIFIERS.NoPermissions]
    });
  }

  private commandDisabledError(): Precondition.Result {
    return this.error({
      message: ERROR_MESSAGES[PRECONDITION_IDENTIFIERS.CommandDisabledInChannel],
      identifier: PRECONDITION_IDENTIFIERS.CommandDisabledInChannel
    });
  }
}
