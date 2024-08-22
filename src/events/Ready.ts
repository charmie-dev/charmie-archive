import { Events, Listener } from '@sapphire/framework';
import Logger, { AnsiColor } from '../lib/utils/logger';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Listener.Options>({ event: Events.ClientReady })
export default class ReadyListener extends Listener<typeof Events.ClientReady> {
  public run() {
    return Logger.log('READY', `Successfully logged in as ${this.container.client.user!.tag}`, {
      color: AnsiColor.Green,
      full: true
    });
  }
}
