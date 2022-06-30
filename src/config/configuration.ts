import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = join(__dirname, '/../../config.yml');

export default () => {
  return yaml.load(readFileSync(YAML_CONFIG_FILENAME, 'utf8')) as Record<
    string,
    any
  >;
};
