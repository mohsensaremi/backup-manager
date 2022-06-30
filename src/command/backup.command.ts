import { Command, CommandRunner } from 'nest-commander';
import { LogService } from '../log.service';
import { BaseCommand } from './base.command';

@Command({ name: 'backup', description: 'A parameter parse' })
export class BackupCommand extends BaseCommand implements CommandRunner {
  constructor(protected readonly logService: LogService) {
    super(logService);
  }

  async run(passedParam: string[]): Promise<void> {
    this.logService.debug('BEGIN backup command');
    console.log('passedParam', passedParam);
  }
}
