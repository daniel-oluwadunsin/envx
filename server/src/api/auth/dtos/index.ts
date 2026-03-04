import { IsEmail, IsString } from 'src/shared/decorators';

export class SignUpDto {
  @IsEmail(false)
  email: string;

  @IsString(false)
  name: string;
}

export class SignInDto {
  @IsEmail(false)
  email: string;
}

export class SignInWithCodeDto {
  @IsEmail(false)
  email: string;

  @IsString(false)
  code: string;
}
