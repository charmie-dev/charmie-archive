import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import Logger, { AnsiColor } from '../utils/logger';

import MessageCache from '../managers/db/MessageCache';
import GuildCache from '../managers/db/GuildCache';

@ApplyOptions<Listener.Options>({ event: Events.ClientReady })
export default class Ready extends Listener<typeof Events.ClientReady> {
  public async run() {
    Logger.log('READY', `Successfully logged in as ${this.container.client.user!.tag}`, {
      color: AnsiColor.Green,
      full: true
    });

    MessageCache.startDatabaseCronJob();
    GuildCache.startCleanupCronJob();
  }
}
