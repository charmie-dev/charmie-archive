import { Precondition } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';

import { PRECONDITION_IDENTIFIERS } from '../utils/constants';
import { CharmieMessageCommand, CommandCategory } from '../managers/commands/Command';

import GuildCache from '../managers/db/GuildCache';

@ApplyOptions<Precondition.Options>({ position: 10 })
export default class EnabledPrecondition extends Precondition {
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
