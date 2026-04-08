import {
  Catch,
  HttpException,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JsonWebTokenError } from '@nestjs/jwt';
import { AxiosError } from 'axios';

interface HttpError {
  message: string;
  error: string;
  statusCode: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();

    let error = 'Oops! an error occured';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      error = (exception.getResponse() as HttpError).message;
      statusCode = exception.getStatus();
    }

    if (exception instanceof JsonWebTokenError) {
      error = exception.message || 'Jwt Malformed';
      statusCode = HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof AxiosError) {
      error = exception.response?.data?.message || 'External API Error';
      statusCode = exception.response?.status || HttpStatus.BAD_GATEWAY;
    }

    console.log(exception);
    httpAdapter.reply(
      ctx.getResponse(),
      { success: false, error, statusCode },
      statusCode,
    );
  }
}
