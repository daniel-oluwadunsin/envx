import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          transport: {
            service: 'gmail',
            auth: {
              user: configService.get<string>('MAILER_USER'),
              pass: configService.get<string>('MAILER_PASS'),
            },
          },

          defaults: {
            from: configService.get<string>('MAILER_FROM_EMAIL'),
          },

          template: {
            dir: join(process.cwd(), 'src/shared/mail/templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
