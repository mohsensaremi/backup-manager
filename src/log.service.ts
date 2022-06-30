import {
  ConsoleLogger,
  Injectable,
  LoggerService,
  LogLevel,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from './event/Log.event';
import { EVENT } from './event/pattern';

@Injectable()
export class LogService extends ConsoleLogger implements LoggerService {
  constructor(private readonly eventEmitter: EventEmitter2) {
    super('LogService', {
      logLevels: ['warn', 'error'],
    });
  }

  log(message: any, context?: string) {
    if (!this.isLevelEnabled('log')) {
      return;
    }

    super.log(message, context);
    this.emitEvent('log', message, context);
  }

  error(message: any, stack?: string, context?: string) {
    if (!this.isLevelEnabled('error')) {
      return;
    }

    super.error(message, stack, context);
    this.emitEvent('error', message, context, stack);
  }

  warn(message: any, context?: string) {
    if (!this.isLevelEnabled('warn')) {
      return;
    }

    super.warn(message, context);
    this.emitEvent('warn', message, context);
  }

  debug(message: any, context?: string) {
    if (!this.isLevelEnabled('debug')) {
      return;
    }

    super.debug(message, context);
    this.emitEvent('debug', message, context);
  }

  verbose(message: any, context?: string) {
    if (!this.isLevelEnabled('verbose')) {
      return;
    }

    super.verbose(message, context);
    this.emitEvent('verbose', message, context);
  }

  private emitEvent(
    level: LogLevel,
    message: any,
    context?: string,
    stack?: string,
  ) {
    this.eventEmitter.emit(
      EVENT.log,
      new LogEvent(level, message, context, stack),
    );
  }
}
