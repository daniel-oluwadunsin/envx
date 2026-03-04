import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { PrismaService } from 'src/api/database/database.service';
import { IsPublic } from 'src/shared/decorators/auth.decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.get(IsPublic, context.getHandler());
    if (isPublic) return true;

    const token = await this.validateToken(request);

    const payload = this.jwtService.verify<{ sub: string }>(token, {
      secret: process.env.JWT_SECRET,
    });

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        userId: payload.sub,
        accessToken: token,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    request.user = { ...user, token: token };

    return true;
  }

  private async validateToken(request: any) {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    return token;
  }
}
