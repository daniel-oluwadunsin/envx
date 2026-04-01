import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { CreateProjectDto } from './dtos';
import * as crypto from 'crypto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CacheKeys, EventNames } from 'src/shared/enums';
import { DeleteUserProjectAccess, PopulateProjectAccess } from './interfaces';
import { UtilsService } from 'src/shared/services/utils.service';
import { UserProjectRoles } from 'generated/prisma/enums';
import { REDIS_PROVIDER } from 'src/shared/providers/redis.provider';
import { Redis } from 'ioredis';

@Injectable()
export class ProjectService {
  private readonly logger: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly utilService: UtilsService,
    @Inject(REDIS_PROVIDER) private readonly redis: Redis,
  ) {
    this.logger = new Logger(ProjectService.name);
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
            },
          },
        },
      });

      if (!access || !access.project) return false;

      const accessKey = access.encryptedKey;
      const userEncryptionKey = user.encryptionKey;
      const projectKey = access.project.projectKey;

      if ([accessKey, userEncryptionKey, projectKey].some((key) => !key))
        return false;

      try {
        const decryptedProjectKey = this.utilService.decrypt(
          JSON.parse(accessKey),
          userEncryptionKey,
        );

        if (decryptedProjectKey != projectKey) return false;

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

  private async generateProjectKey(): Promise<string> {
    let key: string;
    let exists = true;

    while (exists) {
      key = crypto.randomBytes(32).toString('base64');

      const existingProject = await this.prisma.projects.findUnique({
        where: { projectKey: key },
      });

      if (!existingProject) {
        exists = false;
      }
    }

    return key;
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

    const projectKey = await this.generateProjectKey();

    const project = await this.prisma.projects.create({
      data: {
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
        name,
        projectKey,
        description,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const users = await this.prisma.organizationMembers.findMany({
      where: { organizationId },
      select: { userId: true },
    });

    const usersIds = users.map((u) => u.userId);

    this.eventEmitter.emit(EventNames.PopulateProjectAccess, {
      projectId: project.id,
      usersIds,
    } satisfies PopulateProjectAccess);

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
      select: { id: true, encryptionKey: true },
    });

    const data = await Promise.all(
      users.map(async (user) => {
        try {
          const encryptedProjectKey = this.utilService.encrypt(
            project.projectKey,
            user.encryptionKey,
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
