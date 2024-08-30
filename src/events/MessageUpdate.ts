import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message as DiscordMessage, PartialMessage } from 'discord.js';

import { cleanContent } from '../utils';

import MessageCache from '../managers/db/MessageCache';

@ApplyOptions<Listener.Options>({ event: Events.MessageUpdate })
export default class MessageUpdate extends Listener<typeof Events.MessageUpdate> {
  public async run(_oldMessage: never, newMessage: PartialMessage | DiscordMessage<true>) {
    const message = newMessage.partial
      ? ((await newMessage.fetch().catch(() => null)) as DiscordMessage<true> | null)
      : newMessage;

    // Terminate if the message can't be fetched or if there is no content
    if (!message || !message.content) return;

    const newContent = cleanContent(message.content, message.channel);

    await MessageCache.updateContent(message.id, newContent);
  }
}
