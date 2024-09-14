import { Events } from '@sapphire/framework';

import { PieceConfig } from '../CommandManager';
import { MessageCommandError } from './MessageCommandError';
import { MessageCommandDenied } from './MessageCommandDenied';
import { MessageCommandParser } from './MessageCommandParser';
import { ChatInputCommandError } from './ChatInputCommandError';
import { ChatInputCommandDenied } from './ChatInputCommandDenied';

export const ListenerPieces: PieceConfig[] = [
  { store: 'listeners', name: Events.MessageCommandError, piece: MessageCommandError },
  { store: 'listeners', name: Events.MessageCommandDenied, piece: MessageCommandDenied },
  { store: 'listeners', name: 'CorePreMessageParser', piece: MessageCommandParser },
  { store: 'listeners', name: Events.ChatInputCommandError, piece: ChatInputCommandError },
  { store: 'listeners', name: Events.ChatInputCommandDenied, piece: ChatInputCommandDenied }
];
