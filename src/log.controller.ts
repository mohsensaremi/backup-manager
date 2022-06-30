import { Controller, LogLevel } from '@nestjs/common';
import { isPlainObject } from '@nestjs/common/utils/shared.utils';
import { OnEvent } from '@nestjs/event-emitter';
import { LogEvent } from './event/Log.event';
import { EVENT } from './event/pattern';
import { TelegramService } from './service/Telegram.service';

@Controller()
export class LogController {
  constructor(private readonly telegramService: TelegramService) {}

  @OnEvent(EVENT.log)
  async handleLog(payload: LogEvent) {
    await this.telegramService.send(this.formatLogEvent(payload));
  }

  private formatLogEvent(event: LogEvent) {
    const output = this.stringifyMessage(event.message, event.level);
    return `${this.formatPid(String(process.pid))}${this.formatTimestamp(
      event.timestamp,
    )} ${event.level.toUpperCase().padStart(7, ' ')} ${output}`;
  }

  private stringifyMessage(message: string, logLevel: LogLevel) {
    return isPlainObject(message)
      ? `${logLevel}\n${JSON.stringify(
          message,
          (key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          2,
        )}\n`
      : message;
  }

  private formatPid(pid: string) {
    return `[Nest] ${pid}  - `;
  }

  private formatTimestamp(timestamp: number) {
    const localeStringOptions = {
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      day: '2-digit',
      month: '2-digit',
      hourCycle: 'h24',
    } as const;
    return new Date(timestamp * 1000).toLocaleString(
      undefined,
      localeStringOptions,
    );
  }
}
