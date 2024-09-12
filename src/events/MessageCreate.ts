import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';

import MessageCache from '@managers/db/MessageCache';

@ApplyOptions<Listener.Options>({ event: Events.MessageCreate })
export default class MessageCreate extends Listener<typeof Events.MessageCreate> {
  public async run(message: Message) {
    if (message.inGuild() && !message.author.bot) MessageCache.queue(message);
  }
}
