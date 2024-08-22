import { Guilds } from '@prisma/client';
import {
  AliasPiece,
  ApplicationCommandRegistry,
  Command,
  CommandJSON,
  CommandOptions,
  CommandOptionsRunType,
  CommandRunInUnion,
  CommandSpecificRunIn,
  MessageCommandContext,
  Args as SapphireArgs
} from '@sapphire/framework';
import { Awaitable, type Message as DJSMessage } from 'discord.js';

export class CharmieCommand extends Command {
  /**
   * The usage examples for this command.
   *
   * Accepted Types: string[], string, null
   */

  public readonly usage: string[] | string | null;

  /**
   * The category of this command.
   *
   * Accepted Types: string, null
   */

  public readonly ctx: string | null;

  public constructor(context: CharmieCommand.Context, options: CharmieCommandOptions) {
    super(context, options);
    this.usage = options.usage ?? null;
    this.ctx = options.ctx ?? null;
  }

  /**
   * Overriden method that parses the command options and processes them by calling the appropriate sub-methods.
   *
   * #parseConstructorPreConditionsRequiredUserPermissions is exempt from this override to accomodate the permission system
   */

  public override parseConstructorPreConditions(options: CommandOptions) {
    this.parseConstructorPreConditionsRunIn(options);
    this.parseConstructorPreConditionsNsfw(options);
    this.parseConstructorPreConditionsRequiredClientPermissions(options);
    this.parseConstructorPreConditionsCooldown(options);
  }

  public override messageRun?(
    message: CharmieCommand.Message,
    args: CharmieCommand.Args,
    context: CharmieCommand.GuildRunContext | CharmieCommand.RunContext
  ): Awaitable<unknown>;
}

export interface CharmieCommandOptions extends Command.Options {
  /**
   * The category this command belongs to.
   */

  readonly ctx?: string | null;

  /**
   * The usage examples for this command.
   */

  readonly usage?: string[] | string | null;
}

export interface CharmieCommandGuildRunContext extends MessageCommandContext {
  guild: Guilds;
}

export interface CharmieCommandRunContext extends MessageCommandContext {}

export type CharmieMessageCommand = Command & Required<Pick<CharmieCommand, 'messageRun'>>;

export enum CommandCategory {
  Developer = 'Developer',
  Utility = 'Utility'
}

export namespace CharmieCommand {
  export type Message = DJSMessage;
  export type Args = SapphireArgs;
  export type Options = CharmieCommandOptions;
  export type JSON = CommandJSON;
  export type Context = LoaderContext;
  export type LoaderContext = AliasPiece.LoaderContext<'commands'>;
  export type GuildRunContext = CharmieCommandGuildRunContext;
  export type RunContext = CharmieCommandRunContext;
  export type RunInTypes = CommandOptionsRunType;
  export type RunInUnion = CommandRunInUnion;
  export type SpecificRunIn = CommandSpecificRunIn;
  export type Registry = ApplicationCommandRegistry;
  export type ChatInputCommandInteraction<
    Cached extends import('discord.js').CacheType = import('discord.js').CacheType
  > = import('discord.js').ChatInputCommandInteraction<Cached>;
  export type ContextMenuCommandInteraction<
    Cached extends import('discord.js').CacheType = import('discord.js').CacheType
  > = import('discord.js').ContextMenuCommandInteraction<Cached>;
  export type AutocompleteInteraction<Cached extends import('discord.js').CacheType = import('discord.js').CacheType> =
    import('discord.js').AutocompleteInteraction<Cached>;
}
