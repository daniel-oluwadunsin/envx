import { Module } from '@nestjs/common';
import { UtilsService } from 'src/shared/services/utils.service';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { RedisProvider } from './providers/redis.provider';
import { UploadService } from './services/upload.service';

@Module({
  imports: [ConfigModule, MailModule],
  providers: [UtilsService, RedisProvider, UploadService],
  exports: [MailModule, UtilsService, RedisProvider, UploadService],
})
export class SharedModule {}
