import { Precondition } from '@sapphire/framework';
import { ChatInputCommandInteraction, Message } from 'discord.js';

import { PRECONDITION_IDENTIFIERS } from '@utils/constants';

import ConfigManager from '@managers/config/ConfigManager';

export class GuardedPrecondition extends Precondition {
  public async messageRun(message: Message) {
    return this.check(message.author.id);
  }

  public async chatInputRun(interaction: ChatInputCommandInteraction) {
    return this.check(interaction.user.id);
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
