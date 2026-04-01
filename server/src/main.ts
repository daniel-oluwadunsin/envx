import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ValidationException } from 'src/core/exceptions/validation.exception';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from 'src/core/filters/global.filter';
import * as express from 'express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EncryptionInterceptor } from './core/interceptors/encryption.interceptor';
import { UtilsService } from './shared/services/utils.service';
import { RESPONSE_BODY_ENCRYPTION_KEY_HEADER } from './shared/constants/headers.const';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    exposedHeaders: [RESPONSE_BODY_ENCRYPTION_KEY_HEADER],
  });

  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory(errors) {
        return new ValidationException(errors);
      },
    }),
  );

  const utilService = app.get(UtilsService);
  app.useGlobalInterceptors(new EncryptionInterceptor(utilService));

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  const config = new DocumentBuilder()
    .setTitle('EnvX API')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory());

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health-check', (_, res: express.Response) => {
    res.json({ status: 'OK' });
  });

  expressApp.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3000;

  await app.listen(PORT, '0.0.0.0');
  console.info(`Server running on: port ${PORT}`);
}
bootstrap();
