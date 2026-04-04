import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { Auth } from 'src/shared/decorators/auth.decorators';
import { CreateEnvDto, CreateEnvironmentDto, GetEnvDto } from './dtos';
import { MongoIdPipe } from 'src/core/pipes';

@Controller('environment')
export class EnvrionmentsController {
  constructor(private readonly envrionmentsService: EnvironmentsService) {}

  @Post()
  async createEnvironment(
    @Auth('id') userId: string,
    @Body() body: CreateEnvironmentDto,
  ) {
    return await this.envrionmentsService.createEnvironment(userId, body);
  }

  @Get('project/:projectId')
  async getEnvironmentsByProject(
    @Auth('id') userId: string,
    @Param('projectId', MongoIdPipe) projectId: string,
  ) {
    return await this.envrionmentsService.getEnvironments(userId, projectId);
  }

  @Post('/create-env')
  async createEnv(@Auth('id') userId: string, @Body() body: CreateEnvDto) {
    return await this.envrionmentsService.createEnv(userId, body);
  }

  @Post('/get-env')
  async getEnvFile(@Auth('id') userId: string, @Body() body: GetEnvDto) {
    return await this.envrionmentsService.getEnvFile(userId, body);
  }

  @Post('/get-env/keys')
  async getEnvFileKeys(@Auth('id') userId: string, @Body() body: GetEnvDto) {
    return await this.envrionmentsService.getEnvKeys(userId, body);
  }

  @Get('/project/:projectId/slug/:envSlug')
  async getProjectEnvironmentBySlug(
    @Auth('id') userId: string,
    @Param('projectId', MongoIdPipe) projectId: string,
    @Param('envSlug') envSlug: string,
  ) {
    return await this.envrionmentsService.getProjectEnvironmentBySlug(
      userId,
      projectId,
      envSlug,
    );
  }
}
