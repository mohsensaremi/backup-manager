import { ConfigService } from '@nestjs/config';
import { Command, CommandRunner, Option } from 'nest-commander';
import {
  catchError,
  EMPTY,
  filter,
  from,
  lastValueFrom,
  mapTo,
  mergeMap,
  of,
  tap,
} from 'rxjs';
import { StorageConfigInput } from '../input/StorageConfig.input';
import { LogService } from '../log.service';
import { StorageRegistry } from '../repository/StorageRegistry';
import { secondsToClock } from '../utils/clock';
import { BaseCommand } from './base.command';
import * as fs from 'fs';

interface CommandOptions {
  source: StorageConfigInput;
  target: StorageConfigInput;
  output?: string;
}

@Command({
  name: 'differences',
  description: 'Get differences between two storage',
})
export class DifferencesCommand extends BaseCommand implements CommandRunner {
  constructor(
    protected readonly logService: LogService,
    protected readonly configService: ConfigService,
  ) {
    super(logService, configService);
  }

  async run(passedParam: string[], options: CommandOptions): Promise<void> {
    try {
      if (!options.output) {
        this.logService.error('output file required');
      }
      const writeStream = fs.createWriteStream(
        options.output as string,
        'utf-8',
      );

      const beginTime = Date.now();

      this.logService.debug('creating storage registry');
      const registry = new StorageRegistry();

      this.logService.debug('creating source storage');
      const source = this.createStorage(options.source, registry);

      this.logService.debug('creating target storage');
      const target = this.createStorage(options.target, registry);

      this.logService.debug('begin processing');
      for await (const files of source.filesIterable()) {
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
                  tap((file) => this.logService.debug(`checking ${file.path}`)),
                  mergeMap((file) => target.hasFile(file)),
                  filter((hasFile) => !hasFile),
                  tap(() => this.logService.log(`${file.path} not exist`)),
                  tap(() => writeStream.write(`${file.path}\n`)),
                  catchError((error) => {
                    this.logService.error(`error while uploading ${file.path}`);
                    this.logService.error(error, error.stack);
                    return EMPTY;
                  }),
                ),
              100,
            ),
          ),
          { defaultValue: undefined },
        );
      }
      writeStream.end();

      this.logService.log(
        `backup competed in ${secondsToClock(
          Math.round((Date.now() - beginTime) / 1000),
        )}`,
      );
    } catch (e) {
      this.logService.error(e, e.stack);
    }
  }

  @Option({
    flags: '-o, --output [output]',
    description: 'output file',
  })
  getOutputPath(path: string): string {
    return path;
  }
}
