import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import redis, { Redis } from 'ioredis';

export const REDIS_PROVIDER = 'REDIS_PROVIDER';

export const RedisProvider: Provider = {
  provide: REDIS_PROVIDER,
  inject: [ConfigService],
  useFactory(configService: ConfigService) {
    const redis = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      password: configService.get<string>('REDIS_PASSWORD'),
      username: configService.get<string>('REDIS_USERNAME'),
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    redis.on('ready', () => {
      console.log('Redis is ready');
    });

    return redis;
  },
};
