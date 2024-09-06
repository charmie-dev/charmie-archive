import { describe, test } from 'bun:test';
import { fromZodError } from 'zod-validation-error';

import fs from 'fs';

import { readYamlFile } from '../src/utils/index';
import { globalConfigSchema } from '../src/managers/config/schema';

describe('Config Validation', () => {
  test('Global Config', () => {
    if (!fs.existsSync('charmie.cfg.yml')) {
      throw new Error('Unable to find global configuration file. Exiting process...');
    }

    const data = readYamlFile('charmie.cfg.yml');
    const parseResult = globalConfigSchema.safeParse(data);

    if (!parseResult.success) {
      const error = fromZodError(parseResult.error);
      throw new Error(error.toString());
    }
  });
});
