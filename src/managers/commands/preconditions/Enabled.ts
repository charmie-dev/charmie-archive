import { Precondition } from '@sapphire/framework';
import { Message } from 'discord.js';

import { PRECONDITION_IDENTIFIERS } from '@utils/constants';
import { CharmieMessageCommand, CommandCategory } from '@managers/commands/Command';

import GuildCache from '@managers/db/GuildCache';

export class EnabledPrecondition extends Precondition {
  private constructor(context: Precondition.LoaderContext) {
    super(context, { position: 10 });
  }

  public async messageRun(message: Message, command: CharmieMessageCommand) {
    return command.category === CommandCategory.Developer
      ? this.ok()
      : message.inGuild()
        ? this.check(message.guildId, command)
        : this.ok();
  }

  // Handled by discord's permission system

  public async chatInputRun() {
    return this.ok();
  }

  private async check(guildId: string, command: CharmieMessageCommand): Promise<Precondition.Result> {
    return (await GuildCache.get(guildId)).msgCmdsDisabledList.includes(command.name)
      ? this.error({
          message: 'This command is disabled in this server.',
          identifier: PRECONDITION_IDENTIFIERS.CommandDisabled
        })
      : this.ok();
  }
}
