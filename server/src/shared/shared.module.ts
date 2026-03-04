import { Module } from '@nestjs/common';
import { UtilsService } from 'src/shared/services/utils.service';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, MailModule],
  providers: [UtilsService],
  exports: [MailModule, UtilsService],
})
export class SharedModule {}
