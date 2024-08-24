import { ApplyOptions } from '@sapphire/decorators';
import { EmbedBuilder } from 'discord.js';
import { reply } from '@sapphire/plugin-editable-commands';

import ms from 'ms';

import { CharmieCommand, CommandCategory } from '../lib/charmie/Command';
import { DEFAULT_EMBED_COLOR } from '../lib/utils/constants';

import MessageCache from '../lib/managers/cache/MessageCache';

@ApplyOptions<CharmieCommand.Options>({
  ctx: CommandCategory.Developer,
  description: "Get the bot's statistics.",
  aliases: ['stats', 'health'],
  preconditions: ['GuildOnly', 'DeveloperOnly']
})
export default class Statistics extends CharmieCommand {
  public async messageRun(message: CharmieCommand.Message<true>) {
    const { client } = this.container;

    // Make a query to the database and time it.
    // This should give us a rough estimate of the database ping.

    const start = performance.now();
    await this.container.db.guilds.findUnique({ where: { id: message.guildId } });
    const dbQueryPing = performance.now() - start;

    const embed = new EmbedBuilder()
      .setColor(DEFAULT_EMBED_COLOR)
      .setAuthor({ name: `Statistics Report`, iconURL: client.user!.displayAvatarURL() })
      .setThumbnail(client.user!.displayAvatarURL())
      .setFields([
        {
          name: 'Cache Information',
          value: `\\- Guilds: \`${client.guilds.cache.size}\`\n\\- Users: \`${
            client.users.cache.size
          }\`\n\\- Channels: \`${client.channels.cache.size}\`\n\\- Messages: \`${MessageCache.getQueueSize()}\``
        },
        {
          name: 'Process Information',
          value: `\\- RSS Memory: \`${Math.floor(
            process.memoryUsage.rss() / 1024 / 1024
          )} MB\`\n\\- Heap Memory: \`${Math.floor(
            process.memoryUsage().heapUsed / 1024 / 1024
          )} MB\`\n\\- Uptime: \`${ms(client.uptime!, { long: true })}\``
        },
        {
          name: 'Other Information',
          value: `\\- Database Heartbeat: \`${Math.floor(dbQueryPing)}ms\`\n\\- Client Heartbeat: \`${
            client.ws.ping
          }ms\``
        }
      ])
      .setTimestamp();

    return reply(message, { embeds: [embed] });
  }
}
