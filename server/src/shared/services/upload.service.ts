import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage({
      projectId: this.configService.get('GCS_PROJECT_ID'),
      credentials: {
        client_email: this.configService.get('GCS_CLIENT_EMAIL'),
        private_key: this.configService
          .get('GCS_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
      },
    });
    this.bucketName = configService.get('GCS_BUCKET_NAME');
  }

  async uploadBuffer(
    data: Buffer | string,
    destination: string,
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileName = `${Date.now()}-${destination}`;
    const file = bucket.file(fileName);

    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;

    await file.save(bufferData, {
      resumable: false,
      contentType: 'auto',
      public: true,
    });

    const url = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

    return url;
  }
}
