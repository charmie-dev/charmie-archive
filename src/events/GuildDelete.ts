import { Events, Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';

import GuildCache from '@managers/db/GuildCache';

export class GuildDelete extends Listener<typeof Events.GuildDelete> {
  private constructor(context: Listener.LoaderContext) {
    super(context, { event: Events.GuildDelete });
  }

  public run(guild: Guild) {
    GuildCache.wipeCache(guild.id);
  }
}
