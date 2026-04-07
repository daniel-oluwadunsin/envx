import { Module } from '@nestjs/common';
import { UtilsService } from 'src/shared/services/utils.service';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { RedisProvider } from './providers/redis.provider';
import { UploadService } from './services/upload.service';
import { GithubProvider } from './providers/oauth/github.provider';
import { GitlabProvider } from './providers/oauth/gitlab.provider';

@Module({
  imports: [ConfigModule, MailModule],
  providers: [
    UtilsService,
    RedisProvider,
    UploadService,
    GithubProvider,
    GitlabProvider,
  ],
  exports: [
    MailModule,
    UtilsService,
    RedisProvider,
    UploadService,
    GithubProvider,
    GitlabProvider,
  ],
})
export class SharedModule {}
