import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { UtilsService } from 'src/shared/services/utils.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from 'src/shared/enums';
import { SendMail } from 'src/shared/mail/interfaces';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilService: UtilsService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  async inviteMember(organizationId: string, email: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) throw new NotFoundException('Organization not found');

    const invite = await this.prisma.organizationInvite.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
      },
    });

    if (invite) {
      return {
        success: true,
        message: 'Invite already exists',
        data: invite,
      };
    }

    const token = this.utilService.generateRandomCode(32);

    const link = `${this.configService.get('FRONTEND_URL')}/accept-invite?token=${token}&email=${email.toLowerCase()}`;

    const newInvite = await this.prisma.organizationInvite.create({
      data: {
        organizationId,
        email: email.toLowerCase(),
        token: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      },
    });

    this.eventEmitter.emit(EventNames.SendMail, {
      to: email,
      subject: `You're invited to join ${organization.name} on EnvX`,
      template: 'invite',
      context: {
        link,
        organizationName: organization.name,
      },
    } satisfies SendMail);

    return {
      success: true,
      message: 'Member invited successfully',
      data: newInvite,
    };
  }

  async acceptInvite(token: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const invite = await this.prisma.organizationInvite.findFirst({
      where: {
        token,
        email: email.toLowerCase(),
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found or expired');

    await this.prisma.organizationMembers.create({
      data: {
        organizationId: invite.organizationId,
        userId: user.id,
      },
    });

    await this.prisma.organizationInvite.delete({
      where: { id: invite.id },
    });

    return {
      success: true,
      message: 'Invite accepted successfully',
      data: null,
    };
  }

  async getOrganizationMembers(organizationId: string) {
    const members = await this.prisma.organizationMembers.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Organization members retrieved successfully',
      data: members.map((member) => member.user),
    };
  }

  async getInvites(organizationId: string) {
    const invites = await this.prisma.organizationInvite.findMany({
      where: { organizationId },
    });

    return {
      success: true,
      message: 'Organization invites retrieved successfully',
      data: invites,
    };
  }

  async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) throw new NotFoundException('Organization not found');

    return {
      success: true,
      message: 'Organization retrieved successfully',
      data: organization,
    };
  }

  async deleteOrganization(organizationId: string) {
    await this.prisma.organization.delete({
      where: { id: organizationId },
    });

    return {
      success: true,
      message: 'Organization deleted successfully',
      data: null,
    };
  }

  async deleteInvite(inviteId: string) {
    await this.prisma.organizationInvite.delete({
      where: { id: inviteId },
    });

    return {
      success: true,
      message: 'Invite deleted successfully',
      data: null,
    };
  }

  async removeMember(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMembers.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!member)
      throw new NotFoundException('Member not found in organization');

    await this.prisma.organizationMembers.delete({
      where: { id: member.id },
    });

    return {
      success: true,
      message: 'Member removed successfully',
      data: null,
    };
  }

  async getOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMembers.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    const data = memberships.map((m) => ({
      ...m.organization,
      role: m.organization.ownerId === userId ? 'owner' : 'member',
    }));

    return {
      success: true,
      message: 'Organizations retrieved successfully',
      data,
    };
  }
}
