import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Auth } from 'src/shared/decorators/auth.decorators';
import { UpdateUserDto } from './dtos';

@Controller('user')
@ApiTags('user')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getLoggedInUser(@Auth('id') userId: string) {
    return this.userService.getUser(userId);
  }

  @Put('me')
  async updateUser(@Auth('id') userId: string, @Body() data: UpdateUserDto) {
    return this.userService.updateUser(userId, data);
  }
}
