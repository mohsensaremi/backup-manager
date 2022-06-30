import {
  Controller,
  LogLevel,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { isPlainObject } from '@nestjs/common/utils/shared.utils';
import { OnEvent } from '@nestjs/event-emitter';
import {
  bufferTime,
  interval,
  lastValueFrom,
  mergeMap,
  Subject,
  Subscription,
  take,
} from 'rxjs';
import { LogEvent } from './event/Log.event';
import { EVENT } from './event/pattern';
import { TelegramService } from './service/Telegram.service';

@Controller()
export class LogController implements OnModuleInit, OnModuleDestroy {
  private logsBuffer = new Subject<string>();
  private sub?: Subscription;

  constructor(private readonly telegramService: TelegramService) {}

  @OnEvent(EVENT.log)
  handleLog(payload: LogEvent) {
    this.logsBuffer.next(this.formatLogEvent(payload));
  }

  onModuleInit() {
    this.sub = this.logsBuffer
      .pipe(
        bufferTime(60 * 1000),
        mergeMap((logs) => this.telegramService.send(logs.join('\n'))),
      )
      .subscribe();
  }

  async onModuleDestroy() {
    this.logsBuffer.complete();
    await lastValueFrom(this.logsBuffer, { defaultValue: undefined });
    this.sub?.unsubscribe();
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
