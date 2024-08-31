import { ApplyOptions } from '@sapphire/decorators';
import { reply } from '@sapphire/plugin-editable-commands';

import { CharmieCommand, CommandCategory } from '../managers/commands/Command';

/**
 * Gets the websocket heartbeat and roundtrip latency.
 *
 * This command provides the estimated rountrip for sending and editing a message,
 * it is by no means an accurate measure of the api latency.
 */

@ApplyOptions<CharmieCommand.Options>({
  category: CommandCategory.Utility,
  description: `Get the websocket heartbeat and roundtrip latency.`,
  aliases: ['pong', 'latency', 'heartbeat']
})
export default class Ping extends CharmieCommand {
  public async messageRun(message: CharmieCommand.Message) {
    const start = performance.now();
    const msg = await reply(message, 'Pinging...');
    const end = performance.now();

    return msg.edit(
      `Pong! Roundtrip took: ${Math.round(end - start)}ms. Heartbeat: ${this.container.client.ws.ping}ms.`
    );
  }
}
