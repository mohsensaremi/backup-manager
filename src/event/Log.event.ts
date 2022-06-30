import { LogLevel } from '@nestjs/common';
import { EVENT } from './pattern';

export class LogEvent {
  static PATTERN = EVENT.log;

  public readonly timestamp = Math.floor(Date.now() / 1000);

  constructor(
    public readonly level: LogLevel,
    public readonly message: any,
    public readonly context?: string,
    public readonly stack?: string,
  ) {}
}
