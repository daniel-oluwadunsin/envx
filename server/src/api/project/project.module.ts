import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from 'src/shared/shared.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, SharedModule, AuthModule],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
