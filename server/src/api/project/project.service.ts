import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { CreateProjectDto } from './dtos';
import * as crypto from 'crypto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/shared/enums';
import { DeleteUserProjectAccess, PopulateProjectAccess } from './interfaces';
import { UtilsService } from 'src/shared/services/utils.service';
import { UserProjectRoles } from 'generated/prisma/enums';

@Injectable()
export class ProjectService {
  private readonly logger: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly utilService: UtilsService,
  ) {
    this.logger = new Logger(ProjectService.name);
  }

  private async generateProjectKey(): Promise<string> {
    let key: string;
    let exists = true;

    while (exists) {
      key = crypto.randomBytes(32).toString('hex');

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
            Buffer.from(user.encryptionKey, 'hex'),
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
