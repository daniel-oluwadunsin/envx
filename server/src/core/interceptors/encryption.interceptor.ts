import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { map, Observable } from 'rxjs';
import {
  REQUEST_BODY_ENCRYPTION_KEY_REQUEST_HEADER,
  RESPONSE_BODY_ENCRYPTION_KEY_HEADER,
  RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER,
} from 'src/shared/constants/headers.const';
import { UtilsService } from 'src/shared/services/utils.service';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  constructor(private readonly utilService: UtilsService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.body) {
      try {
        const decryptedBody = this.decryptRequestBody(request);
        request.body = JSON.parse(decryptedBody);
      } catch (error) {
        throw new BadRequestException(error.message || 'Invalid payload');
      }
    }

    return next.handle().pipe(
      map((responseBody) => {
        if (responseBody) {
          try {
            return this.encryptResponseBody(request, responseBody);
          } catch (error) {
            throw new BadRequestException(
              error.message || 'Failed to encrypt response body',
            );
          }
        }
      }),
    );
  }

  decryptRequestBody(request: Request): any {
    const encyptedAesKey =
      request.headers[REQUEST_BODY_ENCRYPTION_KEY_REQUEST_HEADER];
    if (!encyptedAesKey || typeof encyptedAesKey !== 'string') {
      throw new BadRequestException(
        'Missing encryption key in request headers',
      );
    }

    const aesKey = this.utilService.decryptWithPrivateKey(encyptedAesKey);

    if (!aesKey) {
      throw new BadRequestException('Failed to decrypt AES key');
    }

    const encryptedData = request.body;
    if (!encryptedData) {
      throw new BadRequestException('Missing encrypted data in request body');
    }

    const decryptedData = this.utilService.decrypt(encryptedData, aesKey);

    if (!decryptedData) {
      throw new BadRequestException('Failed to decrypt request body');
    }

    return decryptedData;
  }

  encryptResponseBody(request: Request, responseBody: any): any {
    const responseBodyPublicKeyEncryptionKeyHeader =
      request.headers[RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER];
    const responseBodyEncryptionKeyHeader =
      request.headers[RESPONSE_BODY_ENCRYPTION_KEY_HEADER];

    const encryptedPublicKeyForResponse = JSON.parse(
      responseBodyPublicKeyEncryptionKeyHeader as string,
    );

    if (!responseBodyEncryptionKeyHeader || !encryptedPublicKeyForResponse) {
      throw new BadRequestException(
        'Missing encryption keys in request headers for response encryption',
      );
    }

    const aesKeyForResponse = this.utilService.decryptWithPrivateKey(
      responseBodyEncryptionKeyHeader as string,
    );

    if (!aesKeyForResponse) {
      throw new BadRequestException('Failed to decrypt AES key for response');
    }

    const decryptedPublicKeyForResponse = this.utilService.decrypt(
      encryptedPublicKeyForResponse,
      aesKeyForResponse,
    );

    if (!decryptedPublicKeyForResponse) {
      throw new BadRequestException(
        'Failed to decrypt public key for response',
      );
    }

    const encryptedResponseBody = this.utilService.encrypt(
      JSON.stringify(responseBody),
      decryptedPublicKeyForResponse,
    );

    return encryptedResponseBody;
  }
}
