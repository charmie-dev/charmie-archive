import { Guilds as DatabaseGuild } from '@prisma/client';
import {
  AliasPiece,
  ApplicationCommandRegistry,
  Command,
  CommandJSON,
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
   */

  public readonly usage: string[] | string | null;

  /**
   * The category option of this command.
   * We use ctx instead of fullCategory as we want the category to be a string instead of an array.
   */

  public readonly ctx: string | null;

  /**
   * The full category of this command.
   * We assign it's value from options.ctx to avoid possible type errors from plugins or other extensions.
   */

  public override readonly fullCategory: readonly string[];

  /**
   * Whether the command is guarded, meaning it can only be used by the bot owners.
   */

  public guarded: boolean;

  /**
   * The mapped flags for the command.
   *
   * Each of these flags is applied to the flags option, however, we use a different type for better option for better readability.
   */

  public readonly mappedFlags: MappedFlag[];

  /**
   * The mapped options for the command.
   *
   * Each of these options is applied to the options option, however, we use a different type for better option for better readability.
   */

  public readonly mappedOptions: MappedOption[];

  /**
   * The constructor of the CharmieCommand class.
   *
   * We override the default sapphire constructor to accomodate for the usage and ctx options
   *
   * @param context The context of the command.
   * @param options The options of the command.
   */

  public constructor(context: CharmieCommand.Context, options: CharmieCommandOptions) {
    super(context, options);

    this.usage = options.usage ?? null;
    this.ctx = options.category ? options.category : null;
    this.fullCategory = options.category ? [options.category] : [];
    this.guarded = options.guarded ?? false;
    this.mappedFlags = options.mappedFlags ?? [];
    this.mappedOptions = options.mappedOptions ?? [];
  }

  /**
   * Overriden method that parses the command options and processes them by calling the appropriate sub-methods.
   *
   * #parseConstructorPreConditionsRequiredUserPermissions is exempt from this override to accomodate the custom permission system
   */

  public override parseConstructorPreConditions(options: CharmieCommandOptions) {
    this.parseConstructorPreConditionsRunIn(options);
    this.parseConstructorPreConditionsNsfw(options);
    this.parseConstructorPreConditionsRequiredClientPermissions(options);
    this.parseConstructorPreConditionsCooldown(options);
    this.parseConstructorPreConditionsGuarded(options);
  }

  /**
   * The method that parses the guarded option.
   * It appends the DeveloperOnly precondition to the preconditions array if the command is guarded.
   *
   * @param options The options of the command.
   */

  protected parseConstructorPreConditionsGuarded(options: CharmieCommandOptions) {
    if (options.guarded) this.preconditions.append('Guarded');
  }

  /**
   * The method that parses the guildOnly precondition.
   * It appends the GuildOnly precondition to the preconditions array if the command is in the Moderation category.
   *
   * @param options The options of the command.
   */

  protected parseConstructorPreConditionsGuildOnly(options: CharmieCommandOptions) {
    if (
      (options.category && options.category === CommandCategory.Moderation) ||
      options.category === CommandCategory.Management
    )
      this.preconditions.append('GuildOnly');
  }

  /**
   * The overriden method that retrieves the command's category.
   * It returns options.ctx instead of options.fullCategory as command categories can only be a single string.
   *
   * @returns string - The category of this command
   */

  public override get category(): string | null {
    return this.ctx;
  }

  public override messageRun?(
    message: CharmieCommand.Message,
    args: CharmieCommand.Args,
    context: CharmieCommand.GuildRunContext | CharmieCommand.RunContext
  ): Awaitable<unknown>;
}

export type MappedFlag = { name: string; aliases: string[] };
export type MappedOption = { name: string; aliases: string[] };

export interface CharmieCommandOptions extends Command.Options {
  /**
   * The category this command belongs to.
   */

  readonly category?: string | null;

  /**
   * The usage examples for this command.
   */

  readonly usage?: string[] | string | null;

  /**
   * Whether this command is guarded, meaning it can only be used by the bot owners.
   */

  readonly guarded?: boolean;

  /**
   * The mapped flags for the command.
   */

  readonly mappedFlags?: MappedFlag[];

  /**
   * The mapped options for the command.
   */

  readonly mappedOptions?: MappedOption[];
}

/**
 * The context applied when running a command in a guild.
 */

export interface CharmieCommandGuildRunContext extends MessageCommandContext {
  config: DatabaseGuild;
}

/**
 * The context applied when running a command outside of a guild.
 */

export interface CharmieCommandRunContext extends MessageCommandContext {}

/**
 * Type that includes the messageRun method for CharmieCommand.
 * Used for type-checking or type-casting.
 */

export type CharmieMessageCommand = Command & Required<Pick<CharmieCommand, 'messageRun'>>;

/**
 * The categories a commmand can belong to.
 */

export enum CommandCategory {
  Developer = 'Developer',
  Management = 'Management',
  Moderation = 'Moderation',
  Utility = 'Utility'
}

/**
 * The exported namespace for CharmieCommand, an extension of the Sapphire Command class.
 *
 * We assign the types here as the command has options different from sapphire,
 * and it accomodates for other options to avoid extra imports.
 */

export namespace CharmieCommand {
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
  export type Message<InGuild extends boolean = boolean> = DJSMessage<InGuild>;
  export type ChatInputCommandInteraction<
    Cached extends import('discord.js').CacheType = import('discord.js').CacheType
  > = import('discord.js').ChatInputCommandInteraction<Cached>;
  export type ContextMenuCommandInteraction<
    Cached extends import('discord.js').CacheType = import('discord.js').CacheType
  > = import('discord.js').ContextMenuCommandInteraction<Cached>;
  export type AutocompleteInteraction<Cached extends import('discord.js').CacheType = import('discord.js').CacheType> =
    import('discord.js').AutocompleteInteraction<Cached>;
}
