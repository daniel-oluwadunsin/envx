import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from 'generated/prisma/client';

// export const Roles = Reflector.createDecorator<RoleNames[]>();

export const IsPublic = Reflector.createDecorator();

export const AllowTempToken = Reflector.createDecorator();

export const Auth = createParamDecorator(
  (props: keyof User | keyof { token?: string }, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();

    return props ? req['user'][props] : req['user'];
  },
);
