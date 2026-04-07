import {
  CreateKeyCommand,
  CreateKeyCommandInput,
  DecryptCommand,
  GenerateDataKeyCommand,
  KMSClient,
  PutKeyPolicyCommand,
} from '@aws-sdk/client-kms';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KmsService {
  private readonly kmsClient: KMSClient;

  constructor() {
    this.kmsClient = new KMSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async generateCmkKey(desc: string = 'EnvX CMK Key') {
    const keyPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowFullAdminAccessToCreator',
          Effect: 'Allow',
          Principal: { AWS: process.env.AWS_ACCESS_KEY_ARN },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'AllowAppUsage',
          Effect: 'Allow',
          Principal: { AWS: process.env.AWS_ACCESS_KEY_ARN },
          Action: [
            'kms:GenerateDataKey',
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:DescribeKey',
          ],
          Resource: '*',
        },
      ],
    };

    const params: CreateKeyCommandInput = {
      Description: desc,
      KeyUsage: 'ENCRYPT_DECRYPT',
      Origin: 'AWS_KMS',
      Policy: JSON.stringify(keyPolicy),
    };

    try {
      const result = await this.kmsClient.send(new CreateKeyCommand(params));

      const cmkKeyId = result.KeyMetadata?.KeyId;

      return cmkKeyId;
    } catch (error) {
      console.error('Error creating CMK:', error);
      throw error;
    }
  }

  async generateDataKey(keyId: string) {
    const command = new GenerateDataKeyCommand({
      KeyId: keyId,
      KeySpec: 'AES_256',
    });

    try {
      const result = await this.kmsClient.send(command);

      const encryptedKeyBase64 = Buffer.from(result.CiphertextBlob!).toString(
        'base64',
      );
      return {
        plaintextKey: result.Plaintext,
        encryptedKeyBase64,
      };
    } catch (error) {
      console.error('Error generating data key:', error);
      throw error;
    }
  }

  async decryptDataKey(encryptedKeyBase64: string) {
    const encryptedKey = Buffer.from(encryptedKeyBase64, 'base64');

    const command = new DecryptCommand({
      CiphertextBlob: encryptedKey,
    });

    try {
      const result = await this.kmsClient.send(command);
      return result.Plaintext;
    } catch (error) {
      console.error('Error decrypting data key:', error);
      throw error;
    }
  }
}
