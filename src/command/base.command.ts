import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { transformAndValidateSync } from 'class-transformer-validator';
import { CommandRunner, Option } from 'nest-commander';
import { DiskStorageConfigInput } from '../input/DiskStorageConfig.input';
import { S3StorageConfigInput } from '../input/S3StorageConfig.input';
import { StorageConfigInput } from '../input/StorageConfig.input';
import { LogService } from '../log.service';
import { DiskStorage } from '../repository/DiskStorage';
import { S3Storage } from '../repository/S3Storage';
import { Storage } from '../repository/Storage';

export abstract class BaseCommand implements CommandRunner {
  constructor(
    protected readonly logService: LogService,
    protected readonly configService: ConfigService,
  ) {}

  abstract run(
    passedParam: string[],
    options?: Record<any, any>,
  ): Promise<void>;

  @Option({
    flags: '-v, --verbose',
    description: 'log level log',
  })
  setV(): void {
    this.logService.setLogLevels(['log', 'warn', 'error']);
  }

  @Option({
    flags: '-vv',
    description: 'log level debug',
  })
  setVV(): void {
    this.logService.setLogLevels(['debug', 'log', 'warn', 'error']);
  }

  @Option({
    flags: '-vvv',
    description: 'log level verbose',
  })
  setVVV(): void {
    this.logService.setLogLevels(['verbose', 'debug', 'log', 'warn', 'error']);
  }

  @Option({
    flags: '-c, --config [path]',
    description: 'config file path',
  })
  getConfigFilePath(path: string): string {
    return path;
  }

  protected createStorage(input: StorageConfigInput): Storage {
    if (input instanceof DiskStorageConfigInput) {
      return new DiskStorage(input.basePath);
    } else if (input instanceof S3StorageConfigInput) {
      const s3 = new S3Client({
        region: 'default',
        endpoint: input.endpoint,
        credentials: {
          accessKeyId: input.credentials.accessKeyId,
          secretAccessKey: input.credentials.secretAccessKey,
        },
      });
      return new S3Storage(s3, input.bucket, this.logService);
    } else {
      throw new Error(`invalid input type ${input.constructor.name}`);
    }
  }

  @Option({
    flags: '-s, --source [source]',
    description: 'source storage',
  })
  getSourceStorage(source: string): Record<any, any> {
    return this.validateStorageConfigInput({
      ...this.configService.getOrThrow(source),
      name: source,
    });
  }

  @Option({
    flags: '-t, --target [target]',
    description: 'target storage',
  })
  getTargetStorage(target: string): Record<any, any> {
    return this.validateStorageConfigInput({
      ...this.configService.getOrThrow(target),
      name: target,
    });
  }

  protected validateStorageConfigInput(
    input: Record<any, any>,
  ): StorageConfigInput {
    switch (input.type) {
      case 'disk':
        return transformAndValidateSync(DiskStorageConfigInput, input);
      case 's3':
        return transformAndValidateSync(S3StorageConfigInput, input);
      default:
        throw new Error(`invalid storage type ${input.type}`);
    }
  }
}
