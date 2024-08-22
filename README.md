# Charmie
Moderation & Utility discord bot designed for speed and reliability.
# Prerequisites
* NodeJS - You must have NodeJS installed on your machine.
* PostgreSQL Server - You must configure, maintain, and run a postgresql server to store persistent data on.
* Sentry - You must have a sentry organization & project configured to log/handle error traces.

An `.env` file is required to run the bot. For information on what values need to be filled out you can view an official example [here](https://github.com/charmie-dev/charmie/blob/main/.env.example).

Additionally you must have a file named `charmie.cfg.yml` in the root directory of this project with the following options:
```yaml
commands:
  prefix: '{default prefix}' # The default prefix for commands (or commands in DMs).

developers: ['{dev id}', '{dev id 2}'] # An array of user IDs permitted to run commands of the "Developer" category.
```
# ❗ Important
This repository contains the bare minimum code for running charmie and it's new infrastructure. It is by no means in a production state and will remain like this until completely finished.
## Aditional Information
If given access, it is absolutely forbidden to share the code inside of this repository with anyone else unless it has been open sourced.
Failure to comply with rule will result in your view permissions being revoked.
