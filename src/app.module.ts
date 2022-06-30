import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BackupCommand } from './command/backup.command';
import configuration from './config/configuration';
// import { LogController } from './log.controller';
import { LogService } from './log.service';
import { TelegramService } from './service/Telegram.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
  ],
  // controllers: [LogController],
  providers: [TelegramService, BackupCommand, LogService],
})
export class AppModule {}
