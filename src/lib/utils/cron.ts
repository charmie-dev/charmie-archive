import { CronJobParams } from '@sentry/node/build/types/cron/cron';
import { CronJob } from 'cron';

import { DEFAULT_TIMEZONE } from './constants';
import { Sentry } from '../..';

import Logger, { AnsiColor } from './logger';
import MessageCache from '../managers/cache/MessageCache';
import { terminateDbConnection } from '.';

/**
 * The class responsible for handling/managing cron utilities.
 */

export default class CronUtils {
  /**
   * Starts a cron job with the given parameters
   *
   * - Tracks the cron job with Sentry
   * - Logs the start of the cron job
   * - Logs each tick of the cron job
   *
   * @param monitorSlug - The slug of the monitor
   * @param cronTime - The cron time string (timezone: {@link DEFAULT_TIMEZONE})
   * @param onTick - The function to run on each tick
   */
  public static startJob(
    monitorSlug: string,
    cronTime: CronJobParams['cronTime'],
    onTick: () => Promise<void> | void
  ): void {
    const cronJobWithCheckIn = Sentry.cron.instrumentCron(CronJob, monitorSlug);

    cronJobWithCheckIn
      .from({
        cronTime,
        timeZone: DEFAULT_TIMEZONE,
        onTick: async () => {
          Logger.log(monitorSlug, 'Running cron job...', {
            color: AnsiColor.Orange
          });

          await onTick();

          Logger.log(monitorSlug, 'Successfully ran cron job', {
            color: AnsiColor.Orange
          });
        }
      })
      .start();

    Logger.log(monitorSlug, `Cron job started: ${cronTime}`, {
      color: AnsiColor.Orange
    });
  }

  /**
   * Starts cleaning up the database and message cache.
   *
   * @param event - The event that triggered the cleanup operations
   */

  static async startCleanupOperations(event: string): Promise<void> {
    Logger.log(event, 'Starting cleanup operations, this may take a while. Please do not send a SIGKILL signal...', {
      color: AnsiColor.Red,
      full: true
    });

    try {
      await MessageCache.store();
      await terminateDbConnection();
    } catch (error) {
      Logger.log(event, `Cleanup operations failed: ${error}`, {
        color: AnsiColor.Red,
        full: true
      });
    } finally {
      Logger.log(event, 'Successfully completed cleanup operations. Exiting process...', {
        color: AnsiColor.Red,
        full: true
      });
    }

    process.exit(0);
  }
}
