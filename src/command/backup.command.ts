import { ConfigService } from '@nestjs/config';
import { Command, CommandRunner } from 'nest-commander';
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
import { StorageConfigInput } from '../input/StorageConfig.input';
import { LogService } from '../log.service';
import { secondsToClock } from '../utils/clock';
import { BaseCommand } from './base.command';

interface CommandOptions {
  source: StorageConfigInput;
  target: StorageConfigInput;
}

@Command({ name: 'backup', description: 'make backup from source to target' })
export class BackupCommand extends BaseCommand implements CommandRunner {
  constructor(
    protected readonly logService: LogService,
    protected readonly configService: ConfigService,
  ) {
    super(logService, configService);
  }

  async run(passedParam: string[], options: CommandOptions): Promise<void> {
    try {
      const beginTime = Date.now();

      this.logService.debug('creating source storage');
      const source = this.createStorage(options.source);

      this.logService.debug('creating target storage');
      const target = this.createStorage(options.target);

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
                      const shouldPass = options.source.exclude.every(
                        (ex) => file.path.indexOf(ex) === -1,
                      );
                      if (!shouldPass) {
                        this.logService.debug(`${file.path} excluded`);
                      }
                      return shouldPass;
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
}
