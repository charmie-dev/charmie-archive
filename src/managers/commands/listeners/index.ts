import { Events } from '@sapphire/framework';

import { ListenerConfig } from '../CommandManager';
import { MessageCommandError } from './MessageCommandError';
import { MessageCommandDenied } from './MessageCommandDenied';
import { MessageCommandParser } from './MessageCommandParser';
import { ChatInputCommandError } from './ChatInputCommandError';
import { ChatInputCommandDenied } from './ChatInputCommandDenied';

export const ListenerPieces: ListenerConfig[] = [
  { name: Events.MessageCommandError, piece: MessageCommandError },
  { name: Events.MessageCommandDenied, piece: MessageCommandDenied },
  { name: 'CorePreMessageParser', piece: MessageCommandParser },
  { name: Events.ChatInputCommandError, piece: ChatInputCommandError },
  { name: Events.ChatInputCommandDenied, piece: ChatInputCommandDenied }
];
