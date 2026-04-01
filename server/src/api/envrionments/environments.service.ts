import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { CreateEnvDto, CreateEnvironmentDto, GetEnvDto } from './dtos';
import { ProjectService } from '../project/project.service';
import { UtilsService } from 'src/shared/services/utils.service';
import { UploadService } from 'src/shared/services/upload.service';

@Injectable()
export class EnvironmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectService: ProjectService,
    private readonly utilsService: UtilsService,
    private readonly uploadService: UploadService,
  ) {}

  async createEnvironment(userId: string, body: CreateEnvironmentDto) {
    const { name, projectId, description } = body;

    const hasProjectAccess = await this.projectService.verifyUserProjectAccess(
      userId,
      projectId,
    );

    if (!hasProjectAccess)
      throw new ForbiddenException(
        'Oops! you do not have access to this project',
      );

    const slug = this.utilsService.slugify(name);

    const existingProject = await this.prisma.environment.findUnique({
      where: {
        projectId_slug: {
          slug,
          projectId,
        },
      },
    });

    if (existingProject)
      throw new ConflictException(
        'Oops! a project with this name already exists',
      );

    const environment = await this.prisma.environment.create({
      data: {
        name,
        slug,
        description,
        project: {
          connect: {
            id: projectId,
          },
        },
      },
    });

    return {
      message: 'Envrionment created successfully',
      success: true,
      data: {
        environmentId: environment.id,
        slug: environment.slug,
      },
    };
  }

  async getEnvironments(userId: string, projectId: string) {
    const hasProjectAccess = await this.projectService.verifyUserProjectAccess(
      userId,
      projectId,
    );

    if (!hasProjectAccess)
      throw new ForbiddenException(
        'Oops! you do not have access to this project',
      );

    const environments = await this.prisma.environment.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    const result = environments.map((env) => {
      return {
        id: env.id,
        name: env.name,
        slug: env.slug,
        description: env.description,
        // return latest env id, and version
      };
    });

    return {
      success: true,
      message: 'Environments fetched successfully',
      data: result,
    };
  }

  async createEnv(userId: string, body: CreateEnvDto) {
    const { envFile, envSlug, projectId } = body;

    const hasProjectAccess = await this.projectService.verifyUserProjectAccess(
      userId,
      projectId,
    );

    if (!hasProjectAccess)
      throw new ForbiddenException(
        'Oops! you do not have access to this project',
      );

    const project = await this.prisma.projects.findUnique({
      where: {
        id: projectId,
      },
      select: {
        projectKey: true,
      },
    });

    if (!project) throw new ConflictException('Oops! project does not exist');

    const environment = await this.prisma.environment.findUnique({
      where: {
        projectId_slug: {
          slug: envSlug,
          projectId,
        },
      },
    });

    if (!environment)
      throw new ConflictException('Oops! environment does not exist');

    const aesKey = this.utilsService.decryptWithPrivateKey(body.encryptionKey);

    const decryptEnv = this.utilsService.decrypt(JSON.parse(envFile), aesKey);

    const envObject = this.utilsService.parseEnv(decryptEnv);

    const envString = JSON.stringify(envObject);

    const encryptedEnv = this.utilsService.encrypt(
      envString,
      project.projectKey,
    );

    const envBlob = Buffer.from(JSON.stringify(encryptedEnv), 'utf-8');

    const envBlobUrl = await this.uploadService.uploadBuffer(
      envBlob,
      `${envSlug}`,
    );

    const latestVersion = await this.prisma.envs
      .findFirst({
        where: {
          environmentId: environment.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      .then((env) => env?.version || 0);

    const newVersion = latestVersion + 1;

    const env = await this.prisma.envs.create({
      data: {
        environment: {
          connect: {
            id: environment.id,
          },
        },
        project: {
          connect: {
            id: projectId,
          },
        },
        createdBy: {
          connect: {
            id: userId,
          },
        },
        blobUrl: envBlobUrl,
        version: newVersion,
      },
    });

    return {
      success: true,
      message: 'Environment file uploaded successfully',
      data: {
        envId: env.id,
        version: env.version,
      },
    };
  }

  async getEnvFile(userId: string, body: GetEnvDto) {
    const { envSlug, projectId, version } = body;

    const hasProjectAccess = await this.projectService.verifyUserProjectAccess(
      userId,
      projectId,
    );

    if (!hasProjectAccess)
      throw new ForbiddenException(
        'Oops! you do not have access to this project',
      );

    const environment = await this.prisma.environment.findUnique({
      where: {
        projectId_slug: {
          slug: envSlug,
          projectId,
        },
      },
    });

    if (!environment)
      throw new ConflictException('Oops! environment does not exist');

    const project = await this.prisma.projects.findUnique({
      where: {
        id: projectId,
      },
      select: {
        projectKey: true,
      },
    });

    if (!project) throw new ConflictException('Oops! project does not exist');

    const env = await this.prisma.envs.findFirst({
      where: {
        environmentId: environment.id,
        version: version || undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!env)
      throw new ConflictException('Oops! environment file does not exist');

    const envBlob = await this.utilsService.fetchEnvBlob(env.blobUrl);
    const encryptedEnvString = envBlob.toString('utf-8');
    const encryptedEnvObj = JSON.parse(encryptedEnvString);

    const decryptedEnvString = this.utilsService.decrypt(
      encryptedEnvObj,
      project.projectKey,
    );

    const decryptedEnvObj = JSON.parse(decryptedEnvString);

    return {
      success: true,
      message: 'Environment file fetched successfully',
      data: {
        envObj: decryptedEnvObj,
      },
    };
  }

  async getEnvKeys(userId: string, body: GetEnvDto) {
    const envObj = await this.getEnvFile(userId, body);

    return {
      success: true,
      message: 'Environment keys fetched successfully',
      data: {
        envKeys: Object.keys(envObj.data.envObj),
      },
    };
  }
}
