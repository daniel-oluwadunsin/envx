import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('org')
@ApiTags('Organization')
export class OrganizationController {}
