import { Events, Listener } from '@sapphire/framework';
import { Message as DiscordMessage, PartialMessage } from 'discord.js';

import { cleanContent } from '@utils/index';

import MessageCache from '@managers/db/MessageCache';

export class MessageUpdate extends Listener<typeof Events.MessageUpdate> {
  private constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.MessageUpdate });
  }

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
