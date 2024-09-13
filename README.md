# Charmie

Moderation & Utility discord bot designed for speed and reliability.

# Requirements

- [Bun Runtime](https://bun.sh/)
- [Typescript](https://www.typescriptlang.org/)
- [PostgreSQL Server](https://www.postgresql.org/)
- [Sentry Project](https://sentry.io/welcome/)

An `.env` file is required to run the bot. For information on what values need to be filled out you can view an official example [here](https://github.com/charmie-dev/charmie/blob/main/.env.example).

Additionally a file with the name `charmie.cfg.yml` must be present in the root directory of this project, and must contain the following options:

```yaml
database:
  messages:
    insert_cron: '{cron}' # Cron expression (see https://crontab.guru/).
    delete_cron: '{cron}' # Cron expression (see https://crontab.guru/).
    ttl: { number } # How old (in milliseconds) messages should be before being deleted from the database.

  config_cache_delete_cron: '{cron}' # Cron expression for wiping the config cache. It's recommended to use an hourly interval for this.

commands:
  prefix: '{default prefix}' # The default prefix for commands or commands in DMs.

developers: ['{dev id}', '{dev id 2}'] # An array of user IDs permitted to run commands of the "Developer" category.
```

# Running the bot

Ensure that your `.env` and `charmie.cfg.yml` files are present and properly configured. One way to validate the global configuration is to levrage bun's test sytem with `bun test`.

## Initially

- All of the following commands should be run in the root directory of this project.
- Additionally, you can configure sentry sourcemaps to be uploaded to sentry.io (`bunx @sentry/wizard@latest -i sourcemaps`).

1. First and foremost, the dependencies required for this project must be installed. You can do this with a package manager of your choice, but for this example we'll be using [bun](https://bun.sh/). Run `bun install` and wait for the installation to finish.

2. Next, we'll need to make sure that your PostgreSQL database matches the prisma schema. To do this, run `bun db:push`.
   Should any errors occur, please ensure that your database is set up correctly.

3. Once your database is set up, we need to build the project. To do this, run `bun compile`.
   This will compile the TypeScript code into JavaScript.

4. Finally, we need to start the bot (aka run the compiled code). To do this, run `bun start` or `bun start:pm2` if you're using PM2.

## Future

- To update the source files of this project you can use `git pull` if you cloned this repository using `git clone`.
- Additionally, you can upload the sourcemaps to sentry (if you configured sourcemaps when setting up this project initially).

1. Depending on whether the source files have been updated, you may need to run `bun install` to install any new dependencies, as well as `bun db:push` to update the database schema.
   If there are any new updates, head over to the `releases` page for more information.

2. Next, we'll need to re build the project (aka compile the TypeScript code to JavaScript). It is recommended that you first get rid of the old `dist` directory. To build the project, simply run `bun compile`.

3. Finally, we just need to restart the bot. To do this, run either `bun start` or `bun start:pm2` if you're using PM2.

# Credits

This bot was created & is maintained by [redicides](https://github.com/redicides), however, it is inspired by multiple other bots and contains code from some of them. The credits for these bots are listed below.

### [[RoDis Infrastructure] Azalea](https://github.com/Rodis-Infrastructure/Azalea)

# Important

It is absolutely forbidden to share the code with anyone else for as long as it remains private.
Failure to comply with this regulation will result in your view permissions being revoked.
