import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { generateKeyPairSync } from 'crypto';
import * as sodium from 'libsodium-wrappers';
import { OAuthProvider } from '../types/oauth';

@Injectable()
export class UtilsService {
  constructor(private readonly configService: ConfigService) {}

  isBase64String(str: string): boolean {
    // Base64 characters: A-Z, a-z, 0-9, +, /, optional padding =
    const base64Regex =
      /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
    return base64Regex.test(str);
  }

  isValidUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  base64ToPEM(base64Key: string): string {
    const formatted = base64Key.match(/.{1,64}/g)?.join('\n'); // split lines
    return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`;
  }

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

  isSlugified(text: string): boolean {
    return this.slugify(text) === text;
  }

  generateAesKey(): Buffer {
    return crypto.randomBytes(32);
  }

  // AES-GCM encryption
  encrypt(
    text: string | Buffer,
    key: Buffer | Uint8Array | string,
  ): { iv: string; data: string; authTag: string } {
    key = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
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
      iv: iv.toString('base64'),
      data: encrypted.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(
    encrypted: { iv: string; data: string; authTag: string },
    key: Buffer | Uint8Array | string,
  ): string {
    key = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.data, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  decryptWithPrivateKey(encryptedData: string, privateKey?: string) {
    privateKey =
      privateKey || this.configService.get<string>('ENCRYPTION_PRIVATE_KEY');

    const buffer = Buffer.from(encryptedData, 'base64');

    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer,
    );

    return decryptedData;
  }

  encryptWithPublicKey(data: string, publicKey: string): string {
    const pemKey = this.isBase64String(publicKey)
      ? this.base64ToPEM(publicKey)
      : publicKey;
    const buffer = Buffer.from(data, 'utf-8');

    const encryptedData = crypto.publicEncrypt(
      {
        key: pemKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer,
    );

    return encryptedData.toString('base64');
  }

  signWithPrivateKey(data: string, privateKey?: string): string {
    privateKey =
      privateKey || this.configService.get<string>('ENCRYPTION_PRIVATE_KEY');
    const buffer = Buffer.from(data, 'utf-8');

    const signature = crypto.sign('sha256', buffer, {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    });

    return signature.toString('base64');
  }

  verifyWithPublicKey(
    data: string,
    signature: string,
    publicKey: string,
  ): boolean {
    const buffer = Buffer.from(data, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'base64');

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

  generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  async encryptLibSodium(secret: string, key: string): Promise<string> {
    await sodium.ready;

    let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    let binsec = sodium.from_string(secret);

    let encBytes = sodium.crypto_box_seal(binsec, binkey);

    let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

    return output;
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

  async addQueryParamsToUrl(
    url: string,
    params: Record<string, string | number | boolean>,
  ): Promise<string> {
    const urlObj = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      urlObj.searchParams.set(key, String(value));
    }
    return urlObj.toString();
  }

  getGitHostInfo(url: string): {
    platform: OAuthProvider;
    owner: string;
    repo: string;
    repoPath: string;
  } {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.toLowerCase();
      const pathParts = parsed.pathname.split('/').filter(Boolean); // remove empty strings

      let platform: 'github' | 'gitlab' | null = null;
      if (domain === 'github.com') platform = 'github';
      else if (domain === 'gitlab.com') platform = 'gitlab';
      else platform = null;

      if (!platform || pathParts.length < 2)
        return { platform, owner: null, repo: null, repoPath: null };

      const owner = pathParts[0];
      const repo = pathParts[1].replace(/\.git$/, ''); // remove .git if present

      const repoPath = `${owner}/${repo}`;

      return { platform, owner, repo, repoPath };
    } catch {
      // Invalid URL
      return { platform: null, owner: null, repo: null, repoPath: null };
    }
  }
}
