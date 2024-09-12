import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Collection, Message as DiscordMessage, PartialMessage, Snowflake } from 'discord.js';

import MessageCache from '@managers/db/MessageCache';

@ApplyOptions<Listener.Options>({ event: Events.MessageBulkDelete })
export default class MessageDeleteBulk extends Listener<typeof Events.MessageBulkDelete> {
  public async run(deletedMessages: Collection<Snowflake, PartialMessage | DiscordMessage<true>>) {
    await MessageCache.deleteMany(deletedMessages);
  }
}
