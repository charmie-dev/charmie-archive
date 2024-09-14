import { PieceConfig } from '../CommandManager';
import { EnabledPrecondition } from './Enabled';
import { GuardedPrecondition } from './Guarded';
import { PermissionsPrecondition } from './Permissions';

export const PreconditionPieces: PieceConfig[] = [
  { store: 'preconditions', name: 'Guarded', piece: GuardedPrecondition },
  { store: 'preconditions', name: 'Enabled', piece: EnabledPrecondition },
  { store: 'preconditions', name: 'Permissions', piece: PermissionsPrecondition }
];
