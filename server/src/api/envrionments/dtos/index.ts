import { IsNumber, IsString } from 'src/shared/decorators';

export class CreateEnvironmentDto {
  @IsString(false)
  name: string;

  @IsString(true)
  description?: string;

  @IsString(false)
  projectId?: string;
}

export class CreateEnvDto {
  @IsString(false)
  envSlug: string;

  @IsString(false)
  envFile: string;

  @IsString(false)
  projectId?: string;

  encryptionKey?: string;
}

export class GetEnvDto {
  @IsString(false)
  envSlug: string;

  @IsString(false)
  projectId?: string;

  @IsNumber(true)
  version?: number;
}
