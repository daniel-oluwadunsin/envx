import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/database.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(name: string, ownerId: string) {
    const organization = await this.prisma.organization.create({
      data: {
        name,
        ownerId,
        organizationMembers: {
          create: {
            userId: ownerId,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Organization created successfully',
      data: organization,
    };
  }
}
