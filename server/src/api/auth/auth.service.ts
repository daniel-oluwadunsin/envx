import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UtilsService } from 'src/shared/services/utils.service';
import { EventNames } from 'src/shared/enums';
import { SendMail } from 'src/shared/mail/interfaces';
import { SignUpDto } from './dtos';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly utilsService: UtilsService,
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(userId: string) {
    const payload = { sub: userId };
    return await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1y',
      algorithm: 'HS256',
    });
  }

  async signIn(email: string) {
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
    const { email, name } = body;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
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
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
      },
    });

    this.eventEmitter.emit(EventNames.SendMail, {
      to: user.email,
      subject: 'Your Sign-In Code',
      template: 'sign-in-code',
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

    await this.prisma.session.create({
      data: {
        userId: signInCode.userId,
        accessToken: token,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expires in 1 year
      },
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
}
