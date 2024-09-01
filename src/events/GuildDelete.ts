import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';

import GuildCache from '../managers/db/GuildCache';

@ApplyOptions<Listener.Options>({ event: Events.GuildDelete })
export default class GuildDelete extends Listener<typeof Events.GuildDelete> {
  public run(guild: Guild) {
    GuildCache.wipeCache(guild.id);
  }
}
