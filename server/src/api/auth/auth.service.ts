import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UtilsService } from 'src/shared/services/utils.service';
import { EventNames } from 'src/shared/enums';
import { SendMail } from 'src/shared/mail/interfaces';
import { SignUpDto } from './dtos';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { CliSignInStatus } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { GithubProvider } from 'src/shared/providers/oauth/github.provider';
import { GitlabProvider } from 'src/shared/providers/oauth/gitlab.provider';
import { KmsService } from 'src/shared/services/kms.service';
import { OAuthProvider } from 'src/shared/types/oauth';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly utilsService: UtilsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly githubProvider: GithubProvider,
    private readonly gitlabProvider: GitlabProvider,
    private readonly kmsService: KmsService,
  ) {}

  private async generateUserKey() {
    const userKey = this.utilsService.generateAesKey().toString('base64');

    const cmsKeyId = process.env.AWS_ENVX_USERS_MASTER_KEY_ID!;

    const { plaintextKey, encryptedKeyBase64 } =
      await this.kmsService.generateDataKey(cmsKeyId);

    const encryptedUserKey = this.utilsService.encrypt(userKey, plaintextKey);

    return {
      userEncryptionKey: JSON.stringify(encryptedUserKey),
      userEncryptedKey: encryptedKeyBase64,
    };
  }

  async decryptUserKey({
    userKmsEncryptedKey,
    userEncryptionKey,
  }: {
    userKmsEncryptedKey: string;
    userEncryptionKey: string;
  }) {
    const decryptedCmkKey =
      await this.kmsService.decryptDataKey(userKmsEncryptedKey);

    const decryptedUserKey = this.utilsService.decrypt(
      JSON.parse(userEncryptionKey),
      decryptedCmkKey,
    );

    return decryptedUserKey;
  }

  private async generateCliSignInCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = this.utilsService.generateRandomCode(6, { digitsOnly: true });

      const existingCode = await this.prisma.cliSignInCode.findFirst({
        where: { deviceCode: code },
      });

      if (!existingCode) {
        exists = false;
      }
    }

    return code;
  }

  async generateToken(userId: string) {
    const payload = { sub: userId };
    return await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1y',
      algorithm: 'HS256',
    });
  }

  async signIn(email: string, cliCode?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const code = this.utilsService.generateRandomCode(6, { digitsOnly: true });

    await this.prisma.signInCodes.create({
      data: {
        code,
        userId: user.id,
        email: user?.email,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
        cliCode: cliCode,
      },
    });

    this.eventEmitter.emit(EventNames.SendMail, {
      to: user.email,
      subject: 'Your Sign-In Code',
      template: 'passwordless-signin',
      context: {
        code,
        email: user.email,
      },
    } satisfies SendMail);

    return {
      message: 'Sign-in code sent to email',
      success: true,
      data: null,
    };
  }

  async signUp(body: SignUpDto) {
    const { email, name, cliCode } = body;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const { userEncryptedKey, userEncryptionKey } =
      await this.generateUserKey();

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        encryptionKey: userEncryptionKey,
        kmsEncryptedKey: userEncryptedKey,
      },
    });

    await this.prisma.organization.create({
      data: {
        name: `${name}'s Organization`,
        ownerId: user.id,
        organizationMembers: {
          create: {
            userId: user.id,
          },
        },
      },
    });

    const code = this.utilsService.generateRandomCode(6, { digitsOnly: true });

    await this.prisma.signInCodes.create({
      data: {
        code,
        userId: user.id,
        email: user?.email,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        cliCode,
      },
    });

    this.eventEmitter.emit(EventNames.SendMail, {
      to: user.email,
      subject: 'Your Sign-In Code',
      template: 'passwordless-signin',
      context: {
        code,
        email: user.email,
      },
    } satisfies SendMail);

    return {
      message: 'User created and sign-in code sent to email',
      success: true,
      data: null,
    };
  }

  async signInWithCode(email: string, code: string) {
    const signInCode = await this.prisma.signInCodes.findFirst({
      where: {
        email: email.toLowerCase(),
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!signInCode) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.prisma.signInCodes.delete({ where: { id: signInCode.id } });

    const token = await this.generateToken(signInCode.userId);

    const createData: Prisma.SessionCreateInput = {
      userId: signInCode.userId,
      accessToken: token,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expires in 1 year
    };

    if (signInCode.cliCode) {
      const cliCode = await this.prisma.cliSignInCode.findFirst({
        where: {
          deviceCode: signInCode.cliCode,
        },
      });

      if (cliCode) {
        if (cliCode.expiresAt < new Date()) {
          await this.prisma.cliSignInCode.update({
            where: { id: cliCode.id },
            data: { status: CliSignInStatus.Expired },
          });
        } else {
          const cliToken = await this.generateToken(signInCode.userId);

          const data = {
            ...createData,
            cliCode: cliCode.deviceCode,
            accessToken: cliToken,
          };

          await this.prisma.session.create({
            data,
          });

          await this.prisma.cliSignInCode.update({
            where: { id: cliCode.id },
            data: { status: CliSignInStatus.Completed },
          });
        }
      }
    }

    await this.prisma.session.create({
      data: createData,
    });

    return {
      success: true,
      message: 'Sign-in successful',
      data: {
        accessToken: token,
      },
    };
  }

  async logOut(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        accessToken: token,
      },
    });

    return {
      success: true,
      message: 'Logged out successfully',
      data: null,
    };
  }

  async initCliSignIn() {
    const code = await this.generateCliSignInCode();

    const TEN_MINUTES_FROM_NOW = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.cliSignInCode.create({
      data: {
        deviceCode: code,
        expiresAt: TEN_MINUTES_FROM_NOW,
      },
    });

    return {
      success: true,
      message: 'CLI sign-in code generated',
      data: {
        deviceCode: code,
        expiresAt: TEN_MINUTES_FROM_NOW,
      },
    };
  }

  async verifyCliSignIn(cliCode: string) {
    const cliSignInCode = await this.prisma.cliSignInCode.findFirst({
      where: {
        deviceCode: cliCode.toString(),
      },
    });

    if (!cliSignInCode) {
      throw new BadRequestException('Invalid CLI code');
    }

    if (cliSignInCode.status != CliSignInStatus.Completed) {
      if (cliSignInCode.expiresAt < new Date()) {
        await this.prisma.cliSignInCode.update({
          where: { id: cliSignInCode.id },
          data: { status: CliSignInStatus.Expired },
        });

        return {
          success: true,
          data: {
            status: 'expired',
          },
        };
      } else {
        return {
          success: true,
          data: {
            status: 'pending',
          },
        };
      }
    }

    const session = await this.prisma.session.findFirst({
      where: {
        cliCode: cliSignInCode.deviceCode,
      },
    });

    if (!session) {
      return {
        success: true,
        data: {
          status: 'failed',
        },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return {
        success: true,
        data: {
          status: 'failed',
        },
      };
    }

    return {
      success: true,
      data: {
        status: 'completed',
        accessToken: session.accessToken,
        user,
      },
    };
  }

  async authorizeCliSignIn(userId: string, cliCode: string) {
    const cliSignInCode = await this.prisma.cliSignInCode.findFirst({
      where: {
        deviceCode: cliCode,
      },
    });

    if (!cliSignInCode) {
      throw new BadRequestException('Invalid CLI code');
    }

    if (cliSignInCode.expiresAt < new Date()) {
      await this.prisma.cliSignInCode.update({
        where: { id: cliSignInCode.id },
        data: { status: CliSignInStatus.Expired },
      });

      throw new BadRequestException('CLI code has expired');
    }

    await this.prisma.cliSignInCode.update({
      where: { id: cliSignInCode.id },
      data: { status: CliSignInStatus.Completed },
    });

    const token = await this.generateToken(userId);

    await this.prisma.session.create({
      data: {
        userId,
        accessToken: token,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cliCode,
      },
    });

    return {
      success: true,
      message: 'CLI session authorized',
    };
  }

  async getEncryptionPublicKey() {
    const publicKey = this.utilsService.generatePublicKeyFromPrivateKey();

    if (!publicKey)
      throw new BadRequestException('Oops! public encryption key not set');

    return {
      success: true,
      message: 'Encryption key fetched successfully',
      data: {
        publicKey,
      },
    };
  }

  async initOAuthSignIn(provider: OAuthProvider, state: string) {
    const baseRedirectUrl =
      provider === 'github'
        ? this.configService.get<string>('GITHUB_REDIRECT_URI')
        : this.configService.get<string>('GITLAB_REDIRECT_URI');

    const redirectUrl = baseRedirectUrl;

    let url = undefined;

    switch (provider.toLowerCase()) {
      case 'github':
        url = this.githubProvider.getOAuthUrl(state, redirectUrl);
        break;
      case 'gitlab':
        url = this.gitlabProvider.getOAuthUrl(state, redirectUrl);
        break;
    }

    if (!url) throw new NotImplementedException('Provider not implemeted');

    return { url, redirectUrl };
  }
}
