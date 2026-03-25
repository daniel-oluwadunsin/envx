import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [DatabaseModule, SharedModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [],
})
export class OrganizationModule {}
