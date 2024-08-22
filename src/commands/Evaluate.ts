import { ApplyOptions } from '@sapphire/decorators';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { reply } from '@sapphire/plugin-editable-commands';

import { CharmieCommand, CommandCategory } from '../lib/charmie/Command';
import { createHastebinPaste } from '../lib/utils';

import util from 'node:util';
import ms from 'ms';

let _;

@ApplyOptions<CharmieCommand.Options>({
  ctx: CommandCategory.Developer,
  description: 'Execute JavaScript code.',
  aliases: ['eval', 'e', 'ev', 'execute', 'exec'],
  options: ['depth', 'd'],
  flags: ['async', 'a', 'silent', 's', 'hide', 'h', 'show', 'sh'],
  preconditions: ['DeveloperOnly']
})
export default class Evaluat extends CharmieCommand {
  public async messageRun(message: CharmieCommand.Message, args: CharmieCommand.Args) {
    const isAsync = args.getFlags('async');
    const depthOpt = args.getOption('depth', 'd');
    const silent = args.getFlags('silent', 's');
    const showHidden = args.getFlags('show', 'sh');
    let hide = args.getFlags('hide', 'h');

    const depth = depthOpt ? parseInt(depthOpt) : 1;

    const code = await args.rest('string').catch(() => null);
    if (!code) throw 'You must provide a string of code to evaluate.';

    if (code.includes('this.container.cache.guilds.findUnique') || code.includes('this.container.db.guilds'))
      hide = true;

    let output: any;
    let error = false;

    let start: number;
    let timeTaken: number;
    try {
      start = performance.now();
      output = await eval(isAsync ? `(async() => { ${code} })()` : code);
      timeTaken = performance.now() - start;
    } catch (e) {
      timeTaken = performance.now() - start!;
      output = e;
      error = true;
    }

    _ = output;
    const type = typeof output;
    output = typeof output === 'string' ? output : util.inspect(output, { depth });
    const unit =
      timeTaken < 1 ? `${Math.round(timeTaken / 1e-2)} microseconds` : ms(Math.round(timeTaken), { long: true });

    if (output.length > 1900) {
      const outBin = await createHastebinPaste(output);

      const button = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('View Here').setURL(outBin);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      if (!silent) return reply(message, { content: `The output cannot be displayed via discord.`, components: [row] });
    }

    const msg = `**Output:**\n\`\`\`ts\n${
      error ? output : hide && !showHidden ? 'hidden' : output
    }\n\`\`\`\n**Return Type:** \`${error ? 'error' : type}\`\n**Time Taken:** \`${unit}\``;

    if (!silent) return reply(message, msg);
  }
}
