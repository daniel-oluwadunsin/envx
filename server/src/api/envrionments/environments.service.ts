import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import {
  CreateEnvDto,
  CreateEnvironmentDto,
  GetEnvDto,
  GetEnvVersionDto,
  RestoreEnvVersionDto,
} from './dtos';
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
        envs: {
          select: {
            version: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    const result = environments.map((env) => {
      return {
        id: env.id,
        name: env.name,
        slug: env.slug,
        description: env.description,
        projectId: projectId,
        latestVersion: env.envs[0]?.version || 0,
        lastUpdated: env.envs[0]?.createdAt || null,
      };
    });

    return {
      success: true,
      message: 'Environments fetched successfully',
      data: result,
    };
  }

  async createEnv(userId: string, body: CreateEnvDto) {
    const { envFile, envSlug: _envSlug, projectId } = body;

    const envSlug = this.utilsService.slugify(_envSlug);

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
        kmsEncryptedKey: true,
      },
    });

    if (!project) throw new ConflictException('Oops! project does not exist');

    let environment = await this.prisma.environment.findUnique({
      where: {
        projectId_slug: {
          slug: envSlug,
          projectId,
        },
      },
    });

    if (!environment) {
      const { data } = await this.createEnvironment(userId, {
        name: _envSlug,
        projectId,
      });

      environment = await this.prisma.environment.findUnique({
        where: {
          id: data.environmentId,
        },
      });
    }

    const aesKey = this.utilsService.decryptWithPrivateKey(body.encryptionKey);

    const decryptEnv = this.utilsService.decrypt(JSON.parse(envFile), aesKey);

    const envObject = this.utilsService.parseEnv(decryptEnv);

    const envString = JSON.stringify(envObject);

    const decryptedProjectKey =
      await this.projectService.decryptProjectKey(project);

    const encryptedEnv = this.utilsService.encrypt(
      envString,
      decryptedProjectKey,
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
        changelog: body.changelog,
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
        kmsEncryptedKey: true,
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
      return {
        success: false,
        message: 'Environment file not found',
      };

    const envBlob = await this.utilsService.fetchEnvBlob(env.blobUrl);
    const encryptedEnvString = envBlob.toString('utf-8');
    const encryptedEnvObj = JSON.parse(encryptedEnvString);

    const decryptedProjectKey =
      await this.projectService.decryptProjectKey(project);

    const decryptedEnvString = this.utilsService.decrypt(
      encryptedEnvObj,
      decryptedProjectKey,
    );

    const decryptedEnvObj = JSON.parse(decryptedEnvString);

    return {
      success: true,
      message: 'Environment file fetched successfully',
      data: {
        envObj: decryptedEnvObj,
        version: env.version,
      },
    };
  }

  async getEnvKeys(userId: string, body: GetEnvDto) {
    const envObj = await this.getEnvFile(userId, body);

    if (!envObj.data) throw new NotFoundException('Environment file not found');

    return {
      success: true,
      message: 'Environment keys fetched successfully',
      data: {
        envKeys: Object.keys(envObj.data?.envObj),
      },
    };
  }

  async getEnvValue(userId: string, body: GetEnvDto & { key: string }) {
    const envObj = await this.getEnvFile(userId, body);

    if (!envObj.data) throw new NotFoundException('Environment file not found');

    const value = envObj.data.envObj[body.key];

    if (value === undefined) {
      return {
        success: false,
        message: 'Key not found in environment',
      };
    }

    return {
      success: true,
      message: 'Environment value fetched successfully',
      data: {
        value,
      },
    };
  }

  async getEnvVersions(userId: string, body: GetEnvVersionDto) {
    const hasProjectAccess = await this.projectService.verifyUserProjectAccess(
      userId,
      body.projectId,
    );

    if (!hasProjectAccess)
      throw new ForbiddenException(
        'Oops! you do not have access to this project',
      );

    const environment = await this.prisma.environment.findUnique({
      where: {
        projectId_slug: {
          slug: body.envSlug,
          projectId: body.projectId,
        },
      },
    });

    if (!environment)
      throw new ConflictException('Oops! environment does not exist');

    const versions = await this.prisma.envs.findMany({
      where: {
        environmentId: environment.id,
      },
      select: {
        id: true,
        version: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        changelog: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return {
      success: true,
      message: 'Environment versions fetched successfully',
      data: versions,
    };
  }

  async restoreEnvVersion(userId: string, body: RestoreEnvVersionDto) {
    const envVersion = await this.prisma.envs.findFirst({
      where: {
        environment: {
          slug: body.envSlug,
          projectId: body.projectId,
        },
        version: body.version,
      },
      include: {
        environment: true,
      },
    });

    if (!envVersion)
      throw new NotFoundException('Environment version not found');

    const newVersion = envVersion.version + 1;

    const newEnv = await this.prisma.envs.create({
      data: {
        environment: {
          connect: {
            id: envVersion.environmentId,
          },
        },
        project: {
          connect: {
            id: body.projectId,
          },
        },
        createdBy: {
          connect: {
            id: userId,
          },
        },
        blobUrl: envVersion.blobUrl,
        version: newVersion,
        changelog: `Restored version ${body.version}`,
      },
    });

    return {
      success: true,
      message: 'Environment version restored successfully',
      data: {
        envId: newEnv.id,
        version: newEnv.version,
      },
    };
  }

  async getProjectEnvironmentBySlug(
    userId: string,
    projectId: string,
    envSlug: string,
  ) {
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
          slug: this.utilsService.slugify(envSlug),
          projectId,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        envs: {
          select: {
            version: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!environment) throw new NotFoundException('Environment not found');

    return {
      success: true,
      message: 'Environment fetched successfully',
      data: {
        id: environment.id,
        name: environment.name,
        slug: environment.slug,
        description: environment.description,
        projectId: projectId,
        latestVersion: environment.envs[0]?.version || 0,
        lastUpdated: environment.envs[0]?.createdAt || null,
      },
    };
  }
}
