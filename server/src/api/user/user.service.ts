import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { UpdateUserDto } from './dtos';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        name: true,
        role: true,
      },
    });

    return {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    };
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        createdAt: true,
        name: true,
        role: true,
      },
    });

    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }
}
