import { Command, CommandRunner, Option } from 'nest-commander';
import { LogService } from './log.service';
import { TelegramService } from './service/Telegram.service';

interface BasicCommandOptions {
  string?: string;
  boolean?: boolean;
  number?: number;
}

@Command({ name: 'backup', description: 'A parameter parse' })
export class BackupCommand implements CommandRunner {
  constructor(
    private readonly logService: LogService,
    private readonly telegramService: TelegramService,
  ) {}

  async run(passedParam: string[]): Promise<void> {
    this.logService.log(passedParam);
  }

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
