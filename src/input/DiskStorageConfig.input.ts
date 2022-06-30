import { Equals, IsString } from 'class-validator';
import { StorageConfigInput } from './StorageConfig.input';

export class DiskStorageConfigInput extends StorageConfigInput {
  @IsString()
  basePath: string;

  @Equals('disk')
  type: 'disk';
}
