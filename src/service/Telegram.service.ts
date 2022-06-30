import * as TelegramBot from 'node-telegram-bot-api';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot?: TelegramBot;
  private token?: string;
  private defaultChatId?: string;
  private logger = new Logger('TelegramService');

  constructor(private configService: ConfigService) {
    this.token = this.configService.get('telegram-bot-token');
    this.defaultChatId = this.configService.get('telegram-chat-id');
  }

  onModuleInit() {
    if (this.token) {
      this.bot = new TelegramBot(this.token);
    }
  }

  async send(text: string, chatId?: string) {
    try {
      await this.bot?.sendMessage(
        (chatId || this.defaultChatId) as string,
        text,
      );
    } catch (error) {
      this.logger.error(error, error.stack);
    }
  }
}
