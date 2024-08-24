import { PermissionFlagsBits } from 'discord.js';
import { MappedFlag, MappedOption } from '../charmie/Command';

// ————————————————————————————————————————————————————————————————————————————————
// Various command related utilities or constants
// ————————————————————————————————————————————————————————————————————————————————

export const EVAL_CMD_FLAGS: MappedFlag[] = [
  { name: 'async', aliases: ['a'] },
  { name: 'silent', aliases: ['s'] },
  { name: 'hide', aliases: ['h'] },
  { name: 'show', aliases: ['sh'] }
];

export const EVAL_CMD_OPTIONS: MappedOption[] = [{ name: 'depth', aliases: ['d'] }];

export const COMMON_STAFF_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageMessages
];

export const MODERATION_COMMANDS = ['warn', 'mute', 'kick', 'ban', 'unmute', 'unban'];
