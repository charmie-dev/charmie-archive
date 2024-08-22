import { Precondition } from '@sapphire/framework';
import { Message } from 'discord.js';
import ConfigManager from '../lib/managers/config/ConfigManager';

export default class DeveloperPrecondition extends Precondition {
  public async messageRun(message: Message) {
    return this.check(message.author.id);
  }

  private async check(id: string) {
    return ConfigManager.global_config.developers.includes(id)
      ? this.ok()
      : this.error({
          message: 'This command is only available to developers.',
          context: {
            silent: true
          }
        });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    DeveloperOnly: never;
  }
}
