import { ApplyOptions } from '@sapphire/decorators';
import { EmbedBuilder } from 'discord.js';
import { reply } from '@sapphire/plugin-editable-commands';

import ms from 'ms';

import { CharmieCommand, CommandCategory } from '../managers/commands/Command';
import { DEFAULT_EMBED_COLOR } from '../utils/constants';

import MessageCache from '../managers/db/MessageCache';

@ApplyOptions<CharmieCommand.Options>({
  ctx: CommandCategory.Developer,
  guarded: true,
  description: "Get the bot's statistics.",
  aliases: ['stats', 'health'],
  preconditions: ['GuildOnly']
})
export default class Statistics extends CharmieCommand {
  public async messageRun(message: CharmieCommand.Message<true>) {
    const { client } = this.container;

    // Make a query to the database and time it.
    // This should give us a rough estimate of the database ping.

    const start = performance.now();
    await this.container.db.guilds.findUnique({ where: { id: message.guildId } });
    const dbQueryPing = performance.now() - start;

    // Get the database size in MB.
    const dbSize = await this.container.db.$queryRaw<[{ size_in_mb: number }]>`
    SELECT pg_database_size(current_database()) / 1024 / 1024 AS size_in_mb
  `;

    const dbSizeInMB = dbSize[0].size_in_mb;

    const embed = new EmbedBuilder()
      .setColor(DEFAULT_EMBED_COLOR)
      .setAuthor({ name: `Statistics Report`, iconURL: client.user!.displayAvatarURL() })
      .setThumbnail(client.user!.displayAvatarURL())
      .setFields([
        {
          name: 'Cache Information',
          value: `Guilds: \`${client.guilds.cache.size}\`\nUsers: \`${client.users.cache.size}\`\nChannels: \`${
            client.channels.cache.size
          }\`\nMessages: \`${MessageCache.getQueueSize()}\``
        },
        {
          name: 'Process Information',
          value: `RSS Memory: \`${Math.floor(
            process.memoryUsage.rss() / 1024 / 1024
          )} MB\`\nHeap Memory: \`${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)} MB\`\nUptime: \`${ms(
            client.uptime!,
            { long: true }
          )}\``
        },
        {
          name: 'Other Information',
          value: `Database Heartbeat: \`${Math.floor(
            dbQueryPing
          )}ms\`\nDatabase Size: \`${dbSizeInMB} MB\`\nClient Heartbeat: \`${client.ws.ping}ms\``
        }
      ]);

    return reply(message, { embeds: [embed] });
  }
}
