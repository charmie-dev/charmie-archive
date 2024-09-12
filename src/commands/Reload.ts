import { ApplyOptions } from '@sapphire/decorators';

import ms from 'ms';

import { CharmieCommand, CommandCategory } from '@managers/commands/Command';

@ApplyOptions<CharmieCommand.Options>({
  category: CommandCategory.Developer,
  guarded: true,
  description: 'Reload a specific command or all commands.',
  usage: ['<command>', '<--all>'],
  flags: ['all', 'a'],
  mappedFlags: [{ name: 'all', aliases: ['a'] }]
})
export default class Reload extends CharmieCommand {
  public async messageRun(message: CharmieCommand.Message, args: CharmieCommand.Args) {
    const reloadAll = args.getFlags('all', 'a');

    const commandName = await args.pick('string').catch(() => null);

    if (reloadAll) {
      const commands = this.container.stores.get('commands').filter(command => command.name !== 'reload');

      const replyToMeLater = await message.reply(`Reloading \`${commands.size}\` commands...`);

      const start = performance.now();
      commands.forEach(async command => {
        await command.reload();
      });
      const end = performance.now();

      const timeTaken = Math.floor(end - start);

      return replyToMeLater.reply(`Reloaded in **${ms(timeTaken, { long: true })}**.`).catch(async () => {
        return await message.channel.send(`Reloaded \`${commands.size}\` in **${ms(timeTaken, { long: true })}**.`);
      });
    }

    if (!commandName) throw 'You must provide the name of a command to reload.';
    if (commandName.toLowerCase() === 'reload') throw 'No.';

    const command = this.container.stores.get('commands').get(commandName);
    if (!command) throw `That command does not exist.`;

    const replyToMeLater = await message.reply(`Reloading \`${command.name}\`...`);

    const start = performance.now();
    await command.reload();
    const end = performance.now();

    const timeTaken = Math.floor(end - start);

    return replyToMeLater.reply(`Reloaded in **${ms(timeTaken, { long: true })}**.`).catch(async () => {
      return await message.channel.send(`Reloaded \`${command.name}\` in **${ms(timeTaken, { long: true })}**.`);
    });
  }
}
