import { IsArray, IsOptional, IsString } from 'class-validator';

export abstract class StorageConfigInput {
  @IsString()
  type: 'disk' | 's3';

  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclude?: string[] | null;
}
