import { Argument } from '@sapphire/framework';

import ms from 'ms';

import { parseDuration } from '@utils/index';

export class DurationArgument extends Argument<number | string | null> {
  public run(parameter: string, context: Argument.Context) {
    if (['permanent', 'perm', 'p', 'infinite', 'inf', 'never'].includes(parameter)) return this.ok('permanent');
    const duration = parseDuration(parameter);

    if (isNaN(duration) || Date.now() + duration < Date.now()) {
      return this.error({
        message: 'The argument did not resolve to a valid duration.',
        parameter,
        context
      });
    }

    if (context.minimum && duration < context.minimum) {
      return this.error({
        message: `The duration must be greater than or equal to ${ms(context.minimum, { long: true })}.`,
        parameter,
        context
      });
    }

    if (context.maximum && duration > context.maximum) {
      return this.error({
        message: `The duration must be less than or equal to ${ms(context.maximum, { long: true })}.`,
        parameter,
        context
      });
    }

    return this.ok(duration);
  }
}

declare module '@sapphire/framework' {
  interface ArgType {
    duration: number | string | null;
  }
}
