import { Equals, IsString, ValidateNested } from 'class-validator';
import { StorageConfigInput } from './StorageConfig.input';

export class S3StorageConfigCredentialsInput {
  @IsString()
  accessKeyId: string;

  @IsString()
  secretAccessKey: string;
}

export class S3StorageConfigInput extends StorageConfigInput {
  @Equals('s3')
  type: 's3';

  @IsString()
  bucket: string;

  @IsString()
  endpoint: string;

  @ValidateNested()
  credentials: S3StorageConfigCredentialsInput;
}
