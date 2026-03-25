import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { Auth, IsPublic } from 'src/shared/decorators/auth.decorators';
import { User } from 'generated/prisma/client';

@Controller('org')
@ApiTags('Organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async createOrganization(
    @Body('name') name: string,
    @Auth('id') ownerId: string,
  ) {
    return this.organizationService.createOrganization(name, ownerId);
  }

  @Post(':organizationId/invite')
  async inviteMember(
    @Body('email') email: string,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationService.inviteMember(organizationId, email);
  }

  @Post(':organizationId/invite/accept')
  async acceptInvite(
    @Param('organizationId') organizationId: string,
    @Auth() user: User,
    @Body('token') token: string,
  ) {
    return this.organizationService.acceptInvite(organizationId, user, token);
  }

  @Get(':organizationId')
  async getOrganization(@Param('organizationId') organizationId: string) {
    return this.organizationService.getOrganization(organizationId);
  }

  @Get(':organizationId/public')
  @IsPublic()
  async getPublicOrganization(@Param('organizationId') organizationId: string) {
    return this.organizationService.getPublicOrganization(organizationId);
  }

  @Get(':organizationId/members')
  async getOrganizationMembers(
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationService.getOrganizationMembers(organizationId);
  }

  @Get(':organizationId/invites')
  async getOrganizationInvites(
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationService.getInvites(organizationId);
  }

  @Delete(':organizationId/members/:memberId')
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Auth('id') userId: string,
  ) {
    return this.organizationService.removeMember(
      organizationId,
      memberId,
      userId,
    );
  }

  @Get()
  async getUserOrganizations(@Auth('id') userId: string) {
    return this.organizationService.getOrganizations(userId);
  }
}
