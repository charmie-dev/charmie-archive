import { PreconditionConfig } from '../CommandManager';
import { EnabledPrecondition } from './Enabled';
import { GuardedPrecondition } from './Guarded';
import { PermissionsPrecondition } from './Permissions';

export const PreconditionPieces: PreconditionConfig[] = [
  { name: 'Guarded', piece: GuardedPrecondition },
  { name: 'Enabled', piece: EnabledPrecondition },
  { name: 'Permissions', piece: PermissionsPrecondition }
];
