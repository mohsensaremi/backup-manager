import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { transformAndValidateSync } from 'class-transformer-validator';
import { Command, CommandRunner, Option } from 'nest-commander';
import {
  catchError,
  EMPTY,
  filter,
  from,
  lastValueFrom,
  mergeMap,
  of,
  tap,
} from 'rxjs';
import { DiskStorageConfigInput } from '../input/DiskStorageConfig.input';
import { S3StorageConfigInput } from '../input/S3StorageConfig.input';
import { StorageConfigInput } from '../input/StorageConfig.input';
import { LogService } from '../log.service';
import { DiskStorage } from '../repository/DiskStorage';
import { S3Storage } from '../repository/S3Storage';
import { Storage } from '../repository/Storage';
import { StorageRegistry } from '../repository/StorageRegistry';
import { secondsToClock } from '../utils/clock';
import { BaseCommand } from './base.command';

interface CommandOptions {
  source: StorageConfigInput;
  target: StorageConfigInput;
}

@Command({ name: 'backup', description: 'A parameter parse' })
export class BackupCommand extends BaseCommand implements CommandRunner {
  constructor(
    protected readonly logService: LogService,
    private readonly configService: ConfigService,
  ) {
    super(logService);
  }

  async run(passedParam: string[], options: CommandOptions): Promise<void> {
    try {
      const beginTime = Date.now();

      this.logService.debug('creating storage registry');
      const registry = new StorageRegistry();

      this.logService.debug('creating source storage');
      const source = this.createStorage(options.source, registry);

      this.logService.debug('creating target storage');
      const target = this.createStorage(options.target, registry);

      this.logService.debug('begin uploading files');
      const asyncIterable = source.filesIterable();
      let i = 0;
      for await (const files of asyncIterable) {
        i++;
        this.logService.debug(
          `processing chunk ${i} with ${files.length} items`,
        );
        await lastValueFrom(
          from(files).pipe(
            mergeMap(
              (file) =>
                of(file).pipe(
                  filter((file) => {
                    if (options.source.exclude) {
                      const shouldExclude = options.source.exclude.every(
                        (ex) => file.path.indexOf(ex) === -1,
                      );
                      if (shouldExclude) {
                        this.logService.debug(`${file.path} excluded`);
                      }
                      return shouldExclude;
                    }
                    return true;
                  }),
                  tap((file) =>
                    this.logService.debug(`checking ${file.path} existence`),
                  ),
                  mergeMap((file) =>
                    from(target.hasFile(file)).pipe(
                      mergeMap((hasFile) => {
                        if (hasFile) {
                          this.logService.debug(
                            `file ${file.path} already exists. skip uploading`,
                          );
                          return EMPTY;
                        } else {
                          this.logService.log(`uploading ${file.path}`);
                          return target.putFile(file);
                        }
                      }),
                    ),
                  ),
                  tap(() => this.logService.log(`${file.path} uploaded`)),
                  catchError((error) => {
                    this.logService.error(`error while uploading ${file.path}`);
                    this.logService.error(error, error.stack);
                    return EMPTY;
                  }),
                ),
              20,
            ),
          ),
          { defaultValue: undefined },
        );
      }

      this.logService.log(
        `backup competed in ${secondsToClock(
          Math.round((Date.now() - beginTime) / 1000),
        )}`,
      );
    } catch (e) {
      this.logService.error(e, e.stack);
    }
  }

  private createStorage(
    input: StorageConfigInput,
    registry: StorageRegistry,
  ): Storage {
    if (input instanceof DiskStorageConfigInput) {
      const storage = new DiskStorage(input.name, registry, input.basePath);
      registry.register(storage);

      return storage;
    } else if (input instanceof S3StorageConfigInput) {
      const s3 = new S3Client({
        region: 'default',
        endpoint: input.endpoint,
        credentials: {
          accessKeyId: input.credentials.accessKeyId,
          secretAccessKey: input.credentials.secretAccessKey,
        },
      });
      const storage = new S3Storage(input.name, registry, s3, input.bucket);
      registry.register(storage);

      return storage;
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

  private validateStorageConfigInput(
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
