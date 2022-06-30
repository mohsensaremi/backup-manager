import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

export default () => {
  const yamlPath = process.argv.find(
    (arg, index) =>
      (/\.yml$/.test(arg) && process.argv[index - 1] === '-c') ||
      process.argv[index - 1] === '--config',
  );
  if (!yamlPath) {
    throw new Error('config YML file is required');
  }
  return yaml.load(readFileSync(yamlPath, 'utf8')) as Record<string, any>;
};
