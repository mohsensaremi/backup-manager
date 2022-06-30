import { CommandRunner, Option } from 'nest-commander';
import { LogService } from '../log.service';

export abstract class BaseCommand implements CommandRunner {
  constructor(protected readonly logService: LogService) {}

  abstract run(passedParam: string[]): Promise<void>;

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
}
