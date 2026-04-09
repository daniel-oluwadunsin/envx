import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  CreateProjectGitHostOriginDto,
  GithubInstallationCallbackDto,
  GithubInstallationWebhookDto,
  InitiateProjectOAuthDto,
  LogOutProjectOAuthDto,
} from './dtos';
import { Auth, IsPublic } from 'src/shared/decorators/auth.decorators';
import { OAuthCallbackDto } from 'src/shared/interfaces';
import { Request, Response } from 'express';
import { MongoIdPipe } from 'src/core/pipes';
import { OAuthProvider } from 'src/shared/types/oauth';

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

  @Get(':projectId')
  async getSingleProject(
    @Auth('id') userId: string,
    @Param('projectId', MongoIdPipe) projectId: string,
  ) {
    return await this.projectService.getSingleProject(userId, projectId);
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

  @Get('github/install/callback')
  @IsPublic()
  async handleGithubInstallCallback(
    @Query() query: GithubInstallationCallbackDto,
    @Res() res: Response,
  ) {
    const redirectUrl =
      await this.projectService.handleGithubInstallationCallback(
        query.installation_id,
        query.state,
      );

    res.redirect(redirectUrl);
  }

  @Post('github/webhook')
  @IsPublic()
  async githubWebhook(
    @Req() req: Request,
    @Body() body: GithubInstallationWebhookDto,
  ) {
    const signature = req.headers['x-hub-signature-256'];

    await this.projectService.handleGithubInstallationWebhook({
      signature: Array.isArray(signature) ? signature[0] : signature,
      rawBody: req['rawBody'],
      payload: body,
      event: Array.isArray(req.headers['x-github-event'])
        ? req.headers['x-github-event'][0]
        : req.headers['x-github-event'],
    });

    return { success: true };
  }

  @Get('oauth/verify')
  async verifyOAuth(
    @Auth('id') userId: string,
    @Query('projectId') projectId: string,
    @Query('provider') provider: string,
  ) {
    return await this.projectService.verifyProjectOAuth(
      userId,
      projectId,
      provider,
    );
  }

  @Post('oauth/remove')
  async removeOAuth(
    @Auth('id') userId: string,
    @Body() body: LogOutProjectOAuthDto,
  ) {
    return await this.projectService.logOutProjectOAuth(userId, body);
  }

  @Get('oauth/providers')
  async getOAuthProviders(
    @Auth('id') userId: string,
    @Query('projectId') projectId: string,
  ) {
    return await this.projectService.checkConfiguredProjectOAuth(
      userId,
      projectId,
    );
  }

  @Get(':projectId/githost')
  async getProjectGitHost(
    @Auth('id') userId: string,
    @Param('projectId', MongoIdPipe) projectId: string,
    @Query('provider') provider: OAuthProvider,
  ) {
    return await this.projectService.getProjectGitHostOrigins(
      userId,
      projectId,
      provider,
    );
  }

  @Post('githost/create')
  async createProjectGitHost(
    @Auth('id') userId: string,
    @Body() body: CreateProjectGitHostOriginDto,
  ) {
    return await this.projectService.createProjectGitHostOrigins(userId, body);
  }
}
