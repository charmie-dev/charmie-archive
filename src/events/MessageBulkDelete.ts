import { Events, Listener } from '@sapphire/framework';
import { Collection, Message as DiscordMessage, PartialMessage, Snowflake } from 'discord.js';

import MessageCache from '@managers/db/MessageCache';

export class MessageDeleteBulk extends Listener<typeof Events.MessageBulkDelete> {
  private constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.MessageBulkDelete });
  }

  public async run(deletedMessages: Collection<Snowflake, PartialMessage | DiscordMessage<true>>) {
    await MessageCache.deleteMany(deletedMessages);
  }
}
