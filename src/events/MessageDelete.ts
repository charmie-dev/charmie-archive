import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message as DiscordMessage } from 'discord.js';

import MessageCache from '@managers/db/MessageCache';

@ApplyOptions<Listener.Options>({ event: Events.MessageDelete })
export default class MessageDelete extends Listener<typeof Events.MessageDelete> {
  public async run(deletedMessage: DiscordMessage) {
    await MessageCache.delete(deletedMessage.id);
  }
}
