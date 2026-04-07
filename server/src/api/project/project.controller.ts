import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, InitiateProjectOAuthDto } from './dtos';
import { Auth, IsPublic } from 'src/shared/decorators/auth.decorators';
import { OAuthCallbackDto } from 'src/shared/interfaces';
import { Response } from 'express';

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

  @Post('oauth/initiate')
  async initiateOAuth(
    @Body() body: InitiateProjectOAuthDto,
    @Auth('id') userId: string,
  ) {
    return await this.projectService.initProjectOAuth(userId, body);
  }

  @Get('oauth/callback')
  @IsPublic()
  async handleOAuthCallback(
    @Query() query: OAuthCallbackDto,
    @Res() res: Response,
  ) {
    const redirectUrl =
      await this.projectService.handleProjectOAuthCallback(query);

    res.redirect(redirectUrl);
  }

  @Get('oauth/verify')
  async verifyOAuth(
    @Query('projectId') projectId: string,
    @Query('provider') provider: string,
  ) {
    return await this.projectService.verifyProjectOAuth(projectId, provider);
  }
}
