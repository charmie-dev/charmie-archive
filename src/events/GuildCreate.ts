import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';

import GuildCache from '../lib/cache/GuildCache';
import Logger from '../lib/utils/logger';

@ApplyOptions<Listener.Options>({ event: Events.GuildCreate })
export default class GuildCreate extends Listener<typeof Events.GuildCreate> {
  public async run(guild: Guild) {
    await GuildCache.confirm(guild.id);
    Logger.info(`Guild created with name ${guild.name} and ID ${guild.id}.`);
  }
}
