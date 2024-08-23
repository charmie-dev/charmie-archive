import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, MessageCommandErrorPayload, UserError } from '@sapphire/framework';

import { embeddedError } from '../../lib/utils';
import { Sentry } from '../..';

import Logger from '../../lib/utils/logger';

@ApplyOptions<Listener.Options>({ event: Events.MessageCommandError })
export default class MessageCommandError extends Listener<typeof Events.MessageCommandError> {
  async run(uError: UserError, { message }: MessageCommandErrorPayload) {
    if (typeof uError !== 'string') {
      const sentryId = Sentry.captureException(uError);
      Logger.error(`Message command error: ${uError}`);
      return embeddedError(
        message,
        `An error occured while running this command, please include this ID when reporting the bug: \`${sentryId}\`.`,
        true
      );
    }

    return embeddedError(message, uError);
  }
}
