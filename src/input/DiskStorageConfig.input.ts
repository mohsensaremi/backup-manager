import { Transform } from 'class-transformer';
import { Equals, IsString } from 'class-validator';
import { StorageConfigInput } from './StorageConfig.input';

export class DiskStorageConfigInput extends StorageConfigInput {
  @IsString()
  @Transform(({ value }) => `${value}/`.replace(/\/+/g, '/'))
  basePath: string;

  @Equals('disk')
  type: 'disk';
}
