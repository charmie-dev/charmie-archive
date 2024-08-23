import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message as DiscordMessage } from 'discord.js';

import MessageCache from '../lib/managers/cache/MessageCache';

@ApplyOptions<Listener.Options>({ event: Events.MessageDelete })
export default class MessageDelete extends Listener<typeof Events.MessageDelete> {
  public async run(deletedMessage: DiscordMessage) {
    await MessageCache.delete(deletedMessage.id);
  }
}
