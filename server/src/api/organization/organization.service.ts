import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { UtilsService } from 'src/shared/services/utils.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from 'src/shared/enums';
import { SendMail } from 'src/shared/mail/interfaces';
import { User } from 'generated/prisma/client';
import {
  DeleteUserProjectAccess,
  PopulateProjectAccess,
} from '../project/interfaces';

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
    await this.prisma.organizationInvite.deleteMany({});
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

    const link = `${this.configService.get('FRONTEND_URL')}/accept-invite?token=${token}&email=${email.toLowerCase()}&orgId=${organizationId}`;

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
      template: 'organization-invite',
      context: {
        inviteLink: link,
        organizationName: organization.name,
      },
    } satisfies SendMail);

    return {
      success: true,
      message: 'Member invited successfully',
      data: newInvite,
    };
  }

  async acceptInvite(organizationId: string, authUser: User, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: authUser.email.toLowerCase() },
    });

    const invite = await this.prisma.organizationInvite.findFirst({
      where: {
        organizationId,
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found or expired');
    if (invite.email.toLowerCase() !== user?.email.toLowerCase()) {
      throw new BadRequestException(
        'This invite is not for your email address',
      );
    }

    await this.prisma.organizationMembers.create({
      data: {
        organizationId: invite.organizationId,
        userId: user.id,
      },
    });

    await this.prisma.organizationInvite.delete({
      where: { id: invite.id },
    });

    // give access to all projects
    const projects = await this.prisma.projects.findMany({
      where: { organizationId },
      select: { id: true },
    });

    projects.forEach((project) => {
      this.eventEmitter.emit(EventNames.PopulateProjectAccess, {
        projectId: project.id,
        usersIds: [user.id],
      } satisfies PopulateProjectAccess);
    });

    return {
      success: true,
      message: 'Invite accepted successfully',
      data: null,
    };
  }

  async getOrganizationMembers(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) throw new NotFoundException('Organization not found');

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
      data: members.map((member) => ({
        ...member.user,
        role: organization.ownerId === member.userId ? 'owner' : 'member',
      })),
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

  async getPublicOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        organizationMembers: true,
        projects: true,
      },
    });

    if (!organization) throw new NotFoundException('Organization not found');

    const data = {
      id: organization.id,
      name: organization.name,
      membersCount: organization.organizationMembers.length,
      projectsCount: organization.projects.length,
    };

    return {
      success: true,
      message: 'Organization retrieved successfully',
      data,
    };
  }

  async deleteOrganization(organizationId: string) {
    await this.prisma.userProjectAccess.deleteMany({
      where: {
        project: {
          organizationId: organizationId,
        },
      },
    });

    await this.prisma.projects.deleteMany({
      where: { organizationId },
    });

    await this.prisma.organizationMembers.deleteMany({
      where: { organizationId },
    });

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

  async removeMember(
    organizationId: string,
    userId: string,
    loggedInUserId: string,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) throw new NotFoundException('Organization not found');

    if (org.ownerId !== loggedInUserId)
      throw new BadRequestException(
        'Only organization owner can remove members',
      );

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

    const projects = await this.prisma.projects.findMany({
      where: { organizationId },
      select: { id: true },
    });

    projects.forEach((project) => {
      this.eventEmitter.emit(EventNames.DeleteUserProjectAccess, {
        projectId: project.id,
        userId,
      } satisfies DeleteUserProjectAccess);
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
      orderBy: {
        organization: {
          createdAt: 'desc',
        },
      },
      include: {
        organization: {
          include: {
            _count: { select: { organizationMembers: true, projects: true } },
          },
        },
      },
    });

    const data = memberships.map((m) => {
      const { _count, ...organization } = m.organization;
      return {
        ...organization,
        role: organization.ownerId === userId ? 'owner' : 'member',
        membersCount: _count.organizationMembers,
        projectsCount: _count.projects,
      };
    });

    return {
      success: true,
      message: 'Organizations retrieved successfully',
      data,
    };
  }
}
