import * as TelegramBot from 'node-telegram-bot-api';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;
  private token: string;
  private defaultChatId: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get('TELEGRAM_BOT_TOKEN', '');
    this.defaultChatId = this.configService.get('TELEGRAM_BOT_CHAT_ID', '');
  }

  onModuleInit() {
    this.bot = new TelegramBot(this.token);
  }

  async send(text: string, chatId?: string) {
    await this.bot.sendMessage(chatId || this.defaultChatId, text);
  }
}
