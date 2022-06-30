import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LogController } from './log.controller';
import { TelegramService } from './service/Telegram.service';
import { BackupCommand } from './backup.command';
import { LogService } from './log.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController, LogController],
  providers: [AppService, TelegramService, BackupCommand, LogService],
})
export class AppModule {}
