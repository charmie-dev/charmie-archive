import { Events, Listener } from '@sapphire/framework';
import { Message as DiscordMessage } from 'discord.js';

import MessageCache from '@managers/db/MessageCache';

export class MessageDelete extends Listener<typeof Events.MessageDelete> {
  private constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.MessageDelete });
  }

  public async run(deletedMessage: DiscordMessage) {
    await MessageCache.delete(deletedMessage.id);
  }
}
