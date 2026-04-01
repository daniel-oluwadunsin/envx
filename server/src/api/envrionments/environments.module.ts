import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from 'src/shared/shared.module';
import { EnvironmentsService } from './environments.service';
import { EnvrionmentsController } from './envrionments.controller';

@Module({
  imports: [DatabaseModule, ProjectModule, SharedModule],
  providers: [EnvironmentsService],
  controllers: [EnvrionmentsController],
})
export class EnvironmentsModule {}
