import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { type SendMail } from './interfaces';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from '../enums';

@Injectable()
export class MailService {
  private readonly logger: Logger;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.logger = new Logger(MailService.name);
  }

  async sendMail(dto: SendMail) {
    const { to, template, context, subject } = dto;
    try {
      await this.mailerService.sendMail({
        from: this.configService.get<string>('MAILER_FROM_EMAIL'),
        to,
        subject,
        template,
        context,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @OnEvent(EventNames.SendMail)
  async sendMailListener(payload: SendMail) {
    this.logger.log('sendMailListener triggered');
    await this.sendMail(payload);
    this.logger.log('sendMailListener completed');
  }
}
