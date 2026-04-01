import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { generateKeyPairSync } from 'crypto';

@Injectable()
export class UtilsService {
  constructor(private readonly configService: ConfigService) {}

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

    return result;
  }

  slugify(text: string): string {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  generateAesKey(): Buffer {
    return crypto.randomBytes(32);
  }

  // AES-GCM encryption
  encrypt(
    text: string | Buffer,
    key: Buffer | string,
  ): { iv: string; data: string; authTag: string } {
    key = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
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
    key: Buffer | string,
  ): string {
    key = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
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

  decryptWithPrivateKey(encryptedData: string, privateKey?: string) {
    privateKey =
      privateKey || this.configService.get<string>('ENCRYPTION_PRIVATE_KEY');
    const buffer = Buffer.from(encryptedData, 'hex');

    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer,
    );

    return decryptedData.toString('utf-8');
  }

  encryptWithPublicKey(data: string, publicKey: string): string {
    const buffer = Buffer.from(data, 'utf-8');

    const encryptedData = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer,
    );

    return encryptedData.toString('hex');
  }

  signWithPrivateKey(data: string, privateKey?: string): string {
    privateKey =
      privateKey || this.configService.get<string>('ENCRYPTION_PRIVATE_KEY');
    const buffer = Buffer.from(data, 'utf-8');

    const signature = crypto.sign('sha256', buffer, {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    });

    return signature.toString('hex');
  }

  verifyWithPublicKey(
    data: string,
    signature: string,
    publicKey: string,
  ): boolean {
    const buffer = Buffer.from(data, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'hex');

    const verify = crypto.createVerify('sha256');
    verify.update(buffer);
    verify.end();

    return verify.verify(publicKey, signatureBuffer);
  }

  generatePublicKeyFromPrivateKey(privateKey?: string): string {
    const keyObject = crypto.createPrivateKey(
      privateKey || this.configService.get<string>('ENCRYPTION_PRIVATE_KEY'),
    );
    const publicKeyObject = crypto.createPublicKey(keyObject);
    return publicKeyObject.export({ type: 'spki', format: 'pem' }).toString();
  }

  parseEnv(envContent: string): Record<string, string> {
    const result: Record<string, string> = {};

    const lines = envContent.split(/\r?\n/);

    let multilineKey: string | null = null;
    let multilineValue: string[] = [];

    for (let rawLine of lines) {
      let line = rawLine.trim();

      // Skip empty lines or comments
      if (!line || line.startsWith('#')) continue;

      // Handle ongoing multiline
      if (multilineKey) {
        // Remove trailing backslash if present
        if (line.endsWith('\\')) {
          multilineValue.push(line.slice(0, -1));
          continue;
        } else {
          multilineValue.push(line);
          result[multilineKey] = multilineValue.join('\n');
          multilineKey = null;
          multilineValue = [];
          continue;
        }
      }

      // Split key and value on the **first '='**
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        // Ignore malformed line
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      // Handle quoted values
      if (
        (value.startsWith('"') && !value.endsWith('"')) ||
        (value.startsWith("'") && !value.endsWith("'"))
      ) {
        // Start of multiline
        multilineKey = key;
        multilineValue.push(value.slice(1)); // remove starting quote
        continue;
      } else if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        // Strip quotes
        value = value.slice(1, -1);
      }

      // Handle escaped sequences
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\=/g, '=')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

      result[key] = value;
    }

    return result;
  }

  async fetchEnvBlob(blobUrl: string): Promise<Buffer> {
    const response = await axios.get(blobUrl, { responseType: 'arraybuffer' });

    return Buffer.from(response.data);
  }
}
