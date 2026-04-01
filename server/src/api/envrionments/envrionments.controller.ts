import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { Auth } from 'src/shared/decorators/auth.decorators';
import { CreateEnvDto, CreateEnvironmentDto, GetEnvDto } from './dtos';
import { MongoIdPipe } from 'src/core/pipes';
import { Response } from 'express';

@Controller('envrionment')
export class EnvrionmentsController {
  constructor(private readonly envrionmentsService: EnvironmentsService) {}

  @Post()
  async createEnvironment(
    @Auth('id') userId: string,
    @Body() body: CreateEnvironmentDto,
  ) {
    return await this.envrionmentsService.createEnvironment(userId, body);
  }

  @Get('project/:projectId')
  async getEnvironmentsByProject(
    @Auth('id') userId: string,
    @Param('projectId', MongoIdPipe) projectId: string,
  ) {
    return await this.envrionmentsService.getEnvironments(userId, projectId);
  }

  @Post('/create-env')
  async createEnv(
    @Auth('id') userId: string,
    @Headers('Encrypted') isEncrypted: string,
    @Headers('X-Encryption-Key') encryptionKey: string,
    @Body() body: CreateEnvDto,
  ) {
    if (isEncrypted != 'true')
      throw new BadRequestException(
        'Encrypted header must be set to true when creating an environment file',
      );

    if (isEncrypted === 'true' && !encryptionKey) {
      throw new BadRequestException(
        'Encryption key is required when Encrypted header is true',
      );
    }

    body.encryptionKey = encryptionKey;
    return await this.envrionmentsService.createEnv(userId, body);
  }

  @Post('/get-file')
  async getEnvFile(
    @Auth('id') userId: string,
    @Body() body: GetEnvDto,
    @Res() res: Response,
  ) {
    const response = await this.envrionmentsService.getEnvFile(userId, body);

    const signature = response.meta.signature;
    res.setHeader('X-Env-Signature', signature);

    delete response.meta;

    return res.send(response);
  }
}
