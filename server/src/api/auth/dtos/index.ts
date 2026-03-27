import { IsEmail, IsString } from 'src/shared/decorators';

export class SignUpDto {
  @IsEmail(false)
  email: string;

  @IsString(false)
  name: string;

  @IsString(true)
  cliCode?: string;
}

export class SignInDto {
  @IsEmail(false)
  email: string;

  @IsString(true)
  cliCode?: string;
}

export class SignInWithCodeDto {
  @IsEmail(false)
  email: string;

  @IsString(false)
  code: string;
}

export class VerifyCliSignInDto {
  @IsString(false)
  cliCode: string;
}
