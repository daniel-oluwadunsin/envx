import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SignInDto,
  SignInWithCodeDto,
  SignUpDto,
  VerifyCliSignInDto,
} from './dtos';
import { Auth, IsPublic } from 'src/shared/decorators/auth.decorators';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @IsPublic()
  async signIn(@Body() body: SignInDto) {
    return await this.authService.signIn(body.email, body.cliCode);
  }

  @Post('sign-up')
  @IsPublic()
  async signUp(@Body() body: SignUpDto) {
    return await this.authService.signUp(body);
  }

  @Post('sign-in-with-code')
  @IsPublic()
  async signInWithCode(@Body() body: SignInWithCodeDto) {
    return await this.authService.signInWithCode(body.email, body.code);
  }

  @Post('log-out')
  async logOut(@Auth('id') userId: string, @Auth('token') token: string) {
    return await this.authService.logOut(userId, token);
  }

  @Post('cli/init')
  @IsPublic()
  async initCliSignIn() {
    return await this.authService.initCliSignIn();
  }

  @Post('cli/verify')
  @IsPublic()
  async verifyCliSignIn(@Body() body: VerifyCliSignInDto) {
    return await this.authService.verifyCliSignIn(body.cliCode);
  }

  @Post('cli/authorize')
  async authorizeCliSignIn(
    @Auth('id') userId: string,
    @Body() body: VerifyCliSignInDto,
  ) {
    return await this.authService.authorizeCliSignIn(userId, body.cliCode);
  }

  @IsPublic()
  @Get('encryption-public-key')
  async getEncryptionPublicKey() {
    return await this.authService.getEncryptionPublicKey();
  }
}
