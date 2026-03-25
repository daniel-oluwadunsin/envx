import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class UtilsService {
  generateRandomCode(length: number, { digitsOnly = false } = {}): string {
    const characters = digitsOnly
      ? '0123456789'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    console.log('Generated code:', result); // Log the generated code for debugging
    return result;
  }

  // AES-GCM encryption
  encrypt(
    text: string | Buffer,
    key: Buffer,
  ): { iv: string; data: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(
        typeof text === 'string' ? Buffer.from(text, 'utf8') : text,
      ),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      data: encrypted.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(
    encrypted: { iv: string; data: string; authTag: string },
    key: Buffer,
  ): string {
    const iv = Buffer.from(encrypted.iv, 'hex');
    const authTag = Buffer.from(encrypted.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.data, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
