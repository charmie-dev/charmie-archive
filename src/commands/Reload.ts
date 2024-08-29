import { ApplyOptions } from '@sapphire/decorators';

import ms from 'ms';

import { CharmieCommand, CommandCategory } from '../lib/charmie/Command';

@ApplyOptions<CharmieCommand.Options>({
  ctx: CommandCategory.Developer,
  guarded: true,
  description: 'Reload a specific command.',
  usage: '<command>'
})
export default class Reload extends CharmieCommand {
  public async messageRun(message: CharmieCommand.Message, args: CharmieCommand.Args) {
    const commandName = await args.pick('string').catch(() => null);
    if (!commandName) throw 'You must provide the name of a command to reload.';

    const command = this.container.stores.get('commands').get(commandName);
    if (!command) throw `That command does not exist.`;

    const replyToMeLater = await message.reply(`Reloading \`${command.name}\`...`);

    const start = performance.now();
    await command.reload();
    const end = performance.now();

    const timeTaken = Math.floor(end - start);

    return replyToMeLater.reply(`Reloaded in **${ms(timeTaken, { long: true })}**.`).catch(() => { 
     return message.channel.send(`Reloaded \`${command.name}\` in **${ms(timeTaken, { long: true })}**.`);
    });
  }
}
