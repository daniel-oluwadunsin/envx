import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import {
  CreateProjectDto,
  CreateProjectGitHostOriginDto,
  InitiateProjectOAuthDto,
  LogOutProjectOAuthDto,
} from './dtos';
import * as crypto from 'crypto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CacheKeys, EventNames } from 'src/shared/enums';
import { DeleteUserProjectAccess, PopulateProjectAccess } from './interfaces';
import { UtilsService } from 'src/shared/services/utils.service';
import { InitOAuthStatus, UserProjectRoles } from 'generated/prisma/enums';
import { REDIS_PROVIDER } from 'src/shared/providers/redis.provider';
import { Redis } from 'ioredis';
import { AuthService } from '../auth/auth.service';
import { add } from 'date-fns';
import { OAuthCallbackDto } from 'src/shared/interfaces';
import { GithubProvider } from 'src/shared/providers/oauth/github.provider';
import { GitlabProvider } from 'src/shared/providers/oauth/gitlab.provider';
import { ConfigService } from '@nestjs/config';
import { Prisma, Projects } from 'generated/prisma/client';
import { KmsService } from 'src/shared/services/kms.service';
import { MakeOAuthRequest, OAuthProvider } from 'src/shared/types/oauth';

@Injectable()
export class ProjectService {
  private readonly logger: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    private readonly utilService: UtilsService,
    private readonly configService: ConfigService,
    private readonly githubProvider: GithubProvider,
    private readonly gitlabProvider: GitlabProvider,
    private readonly kmsService: KmsService,
    @Inject(REDIS_PROVIDER) private readonly redis: Redis,
  ) {
    this.logger = new Logger(ProjectService.name);
  }

  async getProjectGitHostTokens(
    projectId: string,
    provider: OAuthProvider,
  ): Promise<MakeOAuthRequest> {
    const project = await this.prisma.projects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (provider === 'github' && !project.githubToken)
      throw new NotFoundException('Github not configured.');

    if (provider === 'gitlab' && !project.gitlabToken)
      throw new NotFoundException('Gitlab not configured');

    return provider === 'github'
      ? {
          accessToken: project.githubToken,
          expiresAt: project.githubTokenExpiresAt,
          refreshToken: project.githubRefreshToken,
        }
      : {
          accessToken: project.gitlabToken,
          refreshToken: project.gitlabRefreshToken,
          expiresAt: project.gitlabTokenExpiresAt,
          updateAccessToken: async (accessToken, expiresAt) => {
            await this.prisma.projects.update({
              where: {
                id: projectId,
              },
              data: {
                gitlabToken: accessToken,
                gitlabTokenExpiresAt: expiresAt,
              },
            });
          },
        };
  }

  async decryptProjectKey(
    project: Pick<Projects, 'kmsEncryptedKey' | 'projectKey'>,
  ) {
    const plaintextProjectKey = await this.kmsService.decryptDataKey(
      project.kmsEncryptedKey!,
    );

    const decryptedProjectKey = this.utilService.decrypt(
      JSON.parse(project.projectKey),
      plaintextProjectKey,
    );

    return decryptedProjectKey;
  }

  async verifyUserProjectAccess(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    const getAccess = async () => {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          encryptionKey: true,
          kmsEncryptedKey: true,
        },
      });

      if (!user) return false;

      const access = await this.prisma.userProjectAccess.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
        select: {
          encryptedKey: true,
          project: {
            select: {
              projectKey: true,
              kmsEncryptedKey: true,
            },
          },
        },
      });

      if (!access || !access.project) return false;

      const accessKey = access.encryptedKey;
      const userEncryptionKey = user.encryptionKey;
      const userKmsEncryptedKey = user.kmsEncryptedKey;
      const projectKey = access.project.projectKey;
      const projectKmsEncryptedKey = access.project.kmsEncryptedKey;

      if (
        [
          accessKey,
          userEncryptionKey,
          userKmsEncryptedKey,
          projectKey,
          projectKmsEncryptedKey,
        ].some((key) => !key)
      )
        return false;

      try {
        const decryptedUserKey = await this.authService.decryptUserKey({
          userKmsEncryptedKey,
          userEncryptionKey,
        });

        const decryptedProjectKey = await this.decryptProjectKey({
          kmsEncryptedKey: projectKmsEncryptedKey!,
          projectKey: projectKey,
        });

        const decryptedAccessKey = this.utilService.decrypt(
          JSON.parse(accessKey),
          decryptedUserKey,
        );

        if (decryptedAccessKey !== decryptedProjectKey) {
          return false;
        }

        return true;
      } catch (error) {
        this.logger.error(`Error verifying project access ${error}`);
        return false;
      }
    };

    const cacheKey = CacheKeys.UserProjectAccess(userId, projectId);
    const cachedAccess = await this.redis.get(cacheKey);
    if (cachedAccess) {
      return cachedAccess === 'true';
    }

    const access = await getAccess();
    if (access) {
      await this.redis.set(cacheKey, 'true', 'EX', 60 * 30); // Cache for 30 minutes
    }

    return access;
  }

  private async generateProjectKey() {
    const projectKey = this.utilService.generateAesKey().toString('base64');

    const projectMasterKeyId = await this.kmsService.generateCmkKey();

    const { encryptedKeyBase64, plaintextKey } =
      await this.kmsService.generateDataKey(projectMasterKeyId);

    const encryptedProjectKey = this.utilService.encrypt(
      projectKey,
      plaintextKey,
    );

    return {
      encryptedProjectKey: JSON.stringify(encryptedProjectKey),
      encryptedKmsKey: encryptedKeyBase64,
      masterKeyId: projectMasterKeyId,
    };
  }

  async createProject(userId: string, body: CreateProjectDto) {
    const { name, organizationId, description } = body;

    const hasOrgAccess = await this.prisma.organizationMembers.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!hasOrgAccess) {
      throw new BadRequestException(
        "You don't have access to this organization",
      );
    }

    const { encryptedKmsKey, encryptedProjectKey, masterKeyId } =
      await this.generateProjectKey();

    const project = await this.prisma.projects.create({
      data: {
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
        name,
        projectKey: encryptedProjectKey,
        kmsEncryptedKey: encryptedKmsKey,
        masterKeyId: masterKeyId,
        description,
      },
      select: {
        id: true,
        name: true,
      },
    });

    await this.prisma.environment.create({
      data: {
        name: 'Default',
        description:
          'This is the default environment created with the project.',
        slug: this.utilService.slugify('Default'),
        project: { connect: { id: project.id } },
      },
    });

    const users = await this.prisma.organizationMembers.findMany({
      where: { organizationId, userId: { not: userId } },
      select: { userId: true },
    });

    const usersIds = users.map((u) => u.userId);

    // call twice (need to await for current user)
    await this.handlePopulateProjectAccessEvent({
      projectId: project.id,
      usersIds: [userId],
    });

    if (users.length) {
      this.eventEmitter.emit(EventNames.PopulateProjectAccess, {
        projectId: project.id,
        usersIds,
      } satisfies PopulateProjectAccess);
    }

    return {
      success: true,
      message: 'Project created successfully',
      data: project,
    };
  }

  async getProjects(userId: string, organizationId?: string) {
    const organizations = await this.prisma.organizationMembers.findMany({
      where: { userId, ...(organizationId ? { organizationId } : {}) },
    });

    const projects = await this.prisma.projects.findMany({
      where: {
        organizationId: { in: organizations.map((o) => o.organizationId) },
        userProjectAccesses: {
          some: {
            userId,
          },
        },
      },
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = projects.map((project) => ({
      id: project.id,
      name: project.name,
      orgId: project.organizationId,
      orgName: project.organization.name,
      lastUpdated: project.updatedAt,
      description: project.description,
    }));

    return {
      success: true,
      message: 'Projects retrieved successfully',
      data,
    };
  }

  async getSingleProject(userId: string, projectId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        userProjectAccesses: {
          some: {
            userId,
          },
        },
      },
      include: {
        organization: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      success: true,
      message: 'Project retrieved successfully',
      data: {
        id: project.id,
        name: project.name,
        orgId: project.organizationId,
        orgName: project.organization.name,
        lastUpdated: project.updatedAt,
        description: project.description,
      },
    };
  }

  async initProjectOAuth(userId: string, body: InitiateProjectOAuthDto) {
    const { projectId, provider } = body;

    const hasAccess = await this.verifyUserProjectAccess(userId, projectId);

    if (!hasAccess) {
      throw new BadRequestException("You don't have access to this project");
    }

    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
      select: { githubToken: true, gitlabToken: true },
    });

    if (project.githubToken && provider === 'github') {
      throw new BadRequestException(
        'GitHub OAuth has already been completed for this project, run `envx githost github logout` to remove this token.',
      );
    }

    if (project.gitlabToken && provider === 'gitlab') {
      throw new BadRequestException(
        'GitLab OAuth has already been completed for this project, run `envx githost gitlab logout` to remove this token.',
      );
    }

    const state = crypto.randomBytes(16).toString('hex');

    const expiresAt = add(new Date(), { minutes: 10 });

    const { url, redirectUrl } = await this.authService.initOAuthSignIn(
      provider,
      state,
    );

    await this.prisma.initOAuth.create({
      data: {
        project: { connect: { id: projectId } },
        provider,
        state,
        expiresAt,
        redirectUrl,
      },
    });

    return {
      success: true,
      message: 'OAuth initiated',
      data: {
        url,
        state,
      },
    };
  }

  async handleProjectOAuthCallback(body: OAuthCallbackDto) {
    const initOAuth = await this.prisma.initOAuth.findFirst({
      where: {
        provider: body.provider,
        state: body.state,
        status: { not: InitOAuthStatus.Expired },
      },
      include: {
        project: true,
      },
    });

    if (!initOAuth) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    if (initOAuth.status != InitOAuthStatus.Pending) {
      throw new BadRequestException(
        'This OAuth flow has already been completed or expired',
      );
    }

    if (initOAuth.expiresAt < new Date()) {
      await this.prisma.initOAuth.update({
        where: { id: initOAuth.id },
        data: { status: InitOAuthStatus.Expired },
      });

      throw new BadRequestException('OAuth state has expired');
    }

    await this.prisma.initOAuth.update({
      where: { id: initOAuth.id },
      data: { status: InitOAuthStatus.Completed },
    });

    const { accessToken, refreshToken, expiresAt } =
      body.provider === 'github'
        ? await this.githubProvider.exchangeCodeForToken(
            body.code,
            initOAuth.redirectUrl,
          )
        : await this.gitlabProvider.exchangeCodeForToken(
            body.code,
            initOAuth.redirectUrl,
          );

    const updateData: Prisma.ProjectsUpdateInput =
      body.provider === 'github'
        ? {
            githubToken: accessToken,
            githubOAuthCompletedAt: new Date(),
            githubRefreshToken: refreshToken,
            githubTokenExpiresAt: expiresAt,
          }
        : {
            gitlabToken: accessToken,
            gitlabOAuthCompletedAt: new Date(),
            gitlabTokenExpiresAt: expiresAt,
            gitlabRefreshToken: refreshToken,
          };

    await this.prisma.projects.update({
      where: { id: initOAuth.projectId },
      data: updateData,
    });

    await this.prisma.initOAuth.delete({
      where: { id: initOAuth.id },
    });

    const redirectUrl = `${this.configService.get('FRONTEND_URL')}/oauth?oauth_status=success`;

    return redirectUrl;
  }

  async verifyProjectOAuth(
    userId: string,
    projectId: string,
    provider: string,
  ) {
    const hasAccess = await this.verifyUserProjectAccess(userId, projectId);

    if (!hasAccess) {
      throw new BadRequestException("You don't have access to this project");
    }

    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        githubToken: true,
        gitlabToken: true,
      },
    });

    const hasOAuth =
      provider === 'github' ? !!project.githubToken : !!project.gitlabToken;

    return {
      success: true,
      message: 'OAuth status retrieved successfully',
      data: {
        hasOAuth,
      },
    };
  }

  async logOutProjectOAuth(userId: string, body: LogOutProjectOAuthDto) {
    const { projectId, provider, removeOrigins } = body;

    const hasAccess = await this.verifyUserProjectAccess(userId, projectId);

    if (!hasAccess) {
      throw new BadRequestException("You don't have access to this project");
    }

    const updateData: Prisma.ProjectsUpdateInput =
      provider === 'github'
        ? {
            githubToken: null,
            githubOAuthCompletedAt: null,
            githubRefreshToken: null,
            githubTokenExpiresAt: null,
          }
        : {
            gitlabToken: null,
            gitlabOAuthCompletedAt: null,
            gitlabRefreshToken: null,
            gitlabTokenExpiresAt: null,
          };

    await this.prisma.projects.update({
      where: { id: projectId },
      data: updateData,
    });

    if (removeOrigins) {
      await this.prisma.projectGitHostOrigin.deleteMany({
        where: { projectId, githost: provider },
      });
    }

    return {
      success: true,
      message: 'Logged out of OAuth successfully',
    };
  }

  async checkConfiguredProjectOAuth(userId: string, projectId: string) {
    const hasAccess = await this.verifyUserProjectAccess(userId, projectId);

    if (!hasAccess) {
      throw new BadRequestException("You don't have access to this project");
    }

    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        githubToken: true,
        gitlabToken: true,
      },
    });

    const configuredOAuths: OAuthProvider[] = [];
    if (project.githubToken) configuredOAuths.push('github');
    if (project.gitlabToken) configuredOAuths.push('gitlab');

    return {
      success: true,
      message: 'Configured OAuth providers retrieved successfully',
      data: {
        configuredOAuths,
      },
    };
  }

  async getProjectGitHostOrigins(
    userId: string,
    projectId: string,
    provider?: string,
  ) {
    const hasAccess = await this.verifyUserProjectAccess(userId, projectId);

    if (!hasAccess) {
      throw new BadRequestException("You don't have access to this project");
    }

    const githostOrigins = await this.prisma.projectGitHostOrigin.findMany({
      where: { projectId, ...(provider ? { githost: provider } : {}) },
    });

    return {
      success: true,
      message: 'Git host origins retrieved successfully',
      data: githostOrigins,
    };
  }

  async createProjectGitHostOrigins(
    userId: string,
    body: CreateProjectGitHostOriginDto,
  ) {
    const { projectId, hostName, hostUrl } = body;

    if (!this.utilService.isSlugified(hostName)) {
      throw new BadRequestException(
        'Host name must be slugified (lowercase, no spaces, special characters allowed are hyphens and underscores)',
      );
    }

    if (!this.utilService.isValidUrl(hostUrl)) {
      throw new BadRequestException('Invalid host URL');
    }

    const hasAccess = await this.verifyUserProjectAccess(userId, projectId);

    if (!hasAccess) {
      throw new BadRequestException("You don't have access to this project");
    }

    const { platform, repoPath } = this.utilService.getGitHostInfo(hostUrl);

    if (!['github', 'gitlab'].includes(platform)) {
      throw new BadRequestException('Only GitHub and GitLab are supported');
    }

    const existingOrigin = await this.prisma.projectGitHostOrigin.findFirst({
      where: {
        projectId,
        name: hostName,
      },
    });

    if (existingOrigin) {
      throw new BadRequestException(
        'A git host with this name already exists for this project',
      );
    }

    const requestTokens: MakeOAuthRequest = await this.getProjectGitHostTokens(
      projectId,
      platform,
    );

    const repoInfo =
      platform === 'github'
        ? await this.githubProvider.getRepo({
            ...requestTokens,
            repoFullPath: repoPath,
          })
        : await this.gitlabProvider.getRepo({
            ...requestTokens,
            repoFullPath: repoPath,
          });

    await this.prisma.projectGitHostOrigin.create({
      data: {
        project: { connect: { id: projectId } },
        lastUsedBy: { connect: { id: userId } },
        githost: platform,
        name: hostName,
        url: hostUrl,
        repoName: repoInfo.repoName,
        repoFullPath: repoInfo.repoFullPath,
        repoDescription: repoInfo.repoDescription,
        repoId: String(repoInfo.id),
        repoUrl: repoInfo.repoUrl,
        private: repoInfo.private,
        createdAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Git host origin added successfully',
    };
  }

  @OnEvent(EventNames.PopulateProjectAccess)
  private async handlePopulateProjectAccessEvent(
    payload: PopulateProjectAccess,
  ) {
    const { projectId, usersIds } = payload;

    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.error(`Project with id ${projectId} not found`);
      return;
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: usersIds } },
      select: { id: true, encryptionKey: true, kmsEncryptedKey: true },
    });

    const data = await Promise.all(
      users.map(async (user) => {
        try {
          const plaintextKey = await this.kmsService.decryptDataKey(
            user.kmsEncryptedKey!,
          );

          const decryptedUserKey = this.utilService.decrypt(
            JSON.parse(user.encryptionKey),
            plaintextKey,
          );

          const plaintextProjectKey = await this.kmsService.decryptDataKey(
            project.kmsEncryptedKey!,
          );

          const decryptedProjectKey = this.utilService.decrypt(
            JSON.parse(project.projectKey),
            plaintextProjectKey,
          );

          const encryptedProjectKey = this.utilService.encrypt(
            decryptedProjectKey,
            decryptedUserKey,
          );

          const encryptedProjectKeyString = JSON.stringify(encryptedProjectKey);

          await this.prisma.userProjectAccess.upsert({
            where: {
              userId_projectId: {
                userId: user.id,
                projectId: project.id,
              },
            },
            create: {
              userId: user.id,
              projectId: project.id,
              encryptedKey: encryptedProjectKeyString,
            },
            update: {
              encryptedKey: encryptedProjectKeyString,
            },
          });

          return true;
        } catch (error) {
          console.log(error);
          this.logger.error(
            `Failed to populate project access for user ${user.id} and project ${projectId}: ${error.message}`,
          );

          return false;
        }
      }),
    );

    const successCount = data.filter((result) => result).length;
    const failureCount = data.length - successCount;

    this.logger.log(
      `Project access population completed for project ${projectId}. Success: ${successCount}, Failure: ${failureCount}`,
    );
  }

  @OnEvent(EventNames.DeleteUserProjectAccess)
  private async handleDeleteUserProjectAccessEvent(
    payload: DeleteUserProjectAccess,
  ) {
    const { projectId, userId } = payload;

    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.error(`Project with id ${projectId} not found`);
      return;
    }

    await this.prisma.userProjectAccess.deleteMany({
      where: { projectId, userId },
    });

    this.logger.log(
      `Project access deleted for user ${userId} and project ${projectId}`,
    );
  }
}
