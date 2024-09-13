import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';

import MessageCache from '@managers/db/MessageCache';

export class MessageCreate extends Listener<typeof Events.MessageCreate> {
  private constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.MessageCreate });
  }

  public async run(message: Message) {
    if (message.inGuild() && !message.author.bot) MessageCache.queue(message);
  }
}
