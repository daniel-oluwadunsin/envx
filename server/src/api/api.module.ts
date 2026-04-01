import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectModule } from './project/project.module';
import { EnvironmentsModule } from './envrionments/environments.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    ProjectModule,
    EnvironmentsModule,
  ],
})
export class ApiModule {}
