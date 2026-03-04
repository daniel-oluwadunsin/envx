import { IsString } from 'src/shared/decorators';

export class UpdateUserDto {
  @IsString(true)
  name?: string;

  @IsString(true)
  email?: string;
}
