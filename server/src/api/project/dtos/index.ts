import { IsBoolean, IsMongoId } from 'class-validator';
import { IsString } from 'src/shared/decorators';
import { OAuthProvider } from 'src/shared/types/oauth';

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

export class LogOutProjectOAuthDto {
  @IsString(false)
  @IsMongoId()
  projectId: string;

  @IsString(false)
  provider: OAuthProvider;

  @IsBoolean()
  removeOrigins: boolean;
}

export class CreateProjectGitHostOriginDto {
  @IsString(false)
  @IsMongoId()
  projectId: string;

  @IsString(false)
  hostName: string;

  @IsString(false)
  hostUrl: string;
}
