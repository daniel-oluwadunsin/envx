import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static _instance: PrismaService;

  constructor() {
    super({});
  }

  async onModuleInit() {
    await this.$connect();
    console.log('[Database] - connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[Database] - disconnected');
  }
}
