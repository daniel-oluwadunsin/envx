import { IsMongoId } from 'class-validator';
import { IsString } from 'src/shared/decorators';

export class CreateProjectDto {
  @IsString(false)
  name: string;

  @IsString(false)
  @IsMongoId()
  organizationId: string;

  @IsString(true)
  description?: string;
}

export class InitiateProjectOAuthDto {
  @IsString(false)
  @IsMongoId()
  projectId: string;

  @IsString(false)
  provider: OAuthProvider;
}
