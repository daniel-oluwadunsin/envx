import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dtos';
import { Auth } from 'src/shared/decorators/auth.decorators';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(
    @Body() body: CreateProjectDto,
    @Auth('id') userId: string,
  ) {
    return await this.projectService.createProject(userId, body);
  }

  @Get()
  async getProjects(
    @Auth('id') userId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return await this.projectService.getProjects(userId, organizationId);
  }
}
