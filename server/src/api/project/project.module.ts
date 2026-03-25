import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from 'src/shared/shared.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  imports: [DatabaseModule, SharedModule],
  providers: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
