import { Events, Listener } from '@sapphire/framework';

import Logger, { AnsiColor } from '@utils/logger';

import MessageCache from '@managers/db/MessageCache';
import GuildCache from '@managers/db/GuildCache';

export class Ready extends Listener<typeof Events.ClientReady> {
  private constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.ClientReady, once: true });
  }

  public async run() {
    Logger.log('CLIENT', `Successfully logged in as ${this.container.client.user!.tag}.`, {
      color: AnsiColor.Green,
      full: true
    });

    MessageCache.startDatabaseCronJob();
    GuildCache.startCleanupCronJob();
  }
}
