import { Precondition } from '@sapphire/framework';
import { Message } from 'discord.js';

import { PRECONDITION_IDENTIFIERS } from '../lib/utils/constants';

import ConfigManager from '../lib/managers/config/ConfigManager';

export default class GuardedPrecondition extends Precondition {
  public async messageRun(message: Message) {
    return this.check(message.author.id);
  }

  private async check(id: string) {
    return ConfigManager.global_config.developers.includes(id)
      ? this.ok()
      : this.error({
          message: 'This command is only available to developers.',
          identifier: PRECONDITION_IDENTIFIERS.Silent
        });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    Guarded: never;
  }
}
