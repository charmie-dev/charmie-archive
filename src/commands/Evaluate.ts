import { ApplyOptions } from '@sapphire/decorators';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, codeBlock } from 'discord.js';
import { reply } from '@sapphire/plugin-editable-commands';

import { CharmieCommand, CommandCategory } from '../managers/commands/Command';
import { createHastebinPaste } from '../utils';
import { EVAL_CMD_MFLAGS, EVAL_CMD_MOPTIONS } from '../utils/constants';

import util from 'node:util';
import ms from 'ms';

let _;

/**
 * Evaluates a string of javascript code using the NodeJS eval function.
 *
 * Restricted to developers only.
 */

@ApplyOptions<CharmieCommand.Options>({
  category: CommandCategory.Developer,
  guarded: true,
  description: 'Execute JavaScript code.',
  aliases: ['eval', 'e', 'ev', 'execute', 'exec'],
  usage: '<code> [--async] [--depth={depth}] [--silent] [--show] [--hide]',
  mappedOptions: EVAL_CMD_MOPTIONS,
  options: ['depth', 'd'],
  mappedFlags: EVAL_CMD_MFLAGS,
  flags: ['async', 'a', 'silent', 's', 'show-hidden', 'show', 'sh', 'hide', 'h']
})
export class Evaluate extends CharmieCommand {
  public async messageRun(message: CharmieCommand.Message, args: CharmieCommand.Args) {
    const isAsync = args.getFlags('async', 'a');
    const depth = parseInt(args.getOption('depth', 'd') ?? '0');
    const silent = args.getFlags('silent', 's');
    const showHidden = args.getFlags('show-hidden', 'show', 'sh');
    let hide = args.getFlags('hide', 'h');

    const code = await args.rest('string').catch(() => null);
    if (!code) throw 'You must provide a string of code to evaluate.';

    if (this._filter.test(code)) hide = true;

    let output;
    let error = false;

    // time the evaluation
    let start: number;
    let timeTaken: number;
    try {
      start = performance.now();
      output = await eval(isAsync ? `(async() => { ${code} })()` : code);
      timeTaken = performance.now() - start;
    } catch (error) {
      timeTaken = performance.now() - start!;
      output = error;
      error = true;
    }

    _ = output;
    const type = typeof output;
    output = typeof output === 'string' ? output : util.inspect(output, { depth });

    const unit =
      timeTaken < 1 ? `${Math.round(timeTaken / 1e-2)} microseconds` : ms(Math.round(timeTaken), { long: true });

    if (output.length > 1900) {
      const binUrl = await createHastebinPaste(
        hide && !showHidden
          ? `The output was hidden ${
              args.getFlags('hide', 'h') ? 'because you provided the --hide flag' : 'automatically'
            }.\nTo view the full output run the command again but include the --show flag.`
          : output
      );
      const button = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('View Here').setURL(binUrl);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      if (!silent)
        return reply(message, {
          content: `The ${
            error ? 'error' : 'output'
          } exceeded 1900 characters and was uploaded to hastebin instead.\n\n**Return Type:** \`${type}\`\n**Time Taken:** \`${unit}\``,
          components: [row]
        });
    }

    const displayedOutput = hide ? (showHidden ? output : 'Hidden') : output;
    const successMsg = `**Output**\n${codeBlock(
      'ts',
      displayedOutput
    )}\n**Return Type:** \`${type}\`\n**Time Taken:** \`${unit}\``;
    const errorMsg = `**Error**\n${codeBlock('ts', displayedOutput)}`;

    if (!silent) return reply(message, error ? errorMsg : successMsg);
  }

  private readonly _filter =
    /(this.container.db.\w+.(findUnique|update(?!Many)|findMany|delete(?!Many)|findFirst)|process.env(.\w+)*|this.container.client.token)/;
}
