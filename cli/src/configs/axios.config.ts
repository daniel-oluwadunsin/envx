import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_URL, ENCRYPTION_PUBLIC_KEY } from "./const";
import {
  decrypt,
  decryptAESKeyWithRSA_WebCryptoStyle,
  decryptWithPrivateKey,
  encrypt,
  encryptWithPublicKey,
  generateAesKey,
  generateRSAKeyPair,
} from "../utils/encryption";
import { keychainService } from "../utils/keychain";
import { KeychainKey } from "../enums/keychain.enum";
import { KeychainUserData } from "../types/keychain";

type RSAKeyPair = {
  publicKey: string;
  privateKey: string;
  encryptedPublicKey: string;
};

const encryptionStore = {
  keys: [] as RSAKeyPair[],
  setKey: function (keyPair: RSAKeyPair) {
    this.keys.push(keyPair);
  },
  removeKeyWithPrivateKey: function (privateKey: string) {
    this.keys = this.keys.filter((key) => key.privateKey !== privateKey);
  },
};

const REQUEST_BODY_ENCRYPTION_KEY_REQUEST_HEADER =
  "x-request-body-encryption-key";
const RESPONSE_BODY_ENCRYPTION_KEY_HEADER = "x-response-body-encryption-key";
const RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER =
  "x-response-body-public-key-encryption-key";

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const accessStr = await keychainService.getValue(KeychainKey.Access);
  if (accessStr) {
    const access = JSON.parse(accessStr) as KeychainUserData;
    if (access.accessToken) {
      config.headers.Authorization = `Bearer ${access.accessToken}`;
    }
  }

  if (config.data) {
    // Generate AES key and IV
    const aesKey = generateAesKey();
    const encryptedData = encrypt(JSON.stringify(config.data), aesKey);

    config.data = encryptedData;

    const encryptedAesKey = encryptWithPublicKey(aesKey, ENCRYPTION_PUBLIC_KEY);

    config.headers[REQUEST_BODY_ENCRYPTION_KEY_REQUEST_HEADER] =
      encryptedAesKey;
  }

  // encryption key for response
  const { publicKey, privateKey } = generateRSAKeyPair();

  const aesKeyForResponse = generateAesKey();

  const encryptedPublicKeyForResponse = encrypt(publicKey, aesKeyForResponse);

  const encryptedAesKeyForResponse = encryptWithPublicKey(
    aesKeyForResponse,
    ENCRYPTION_PUBLIC_KEY,
  );

  config.headers[RESPONSE_BODY_ENCRYPTION_KEY_HEADER] =
    encryptedAesKeyForResponse;

  config.headers[RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER] =
    JSON.stringify(encryptedPublicKeyForResponse);

  encryptionStore.setKey({
    publicKey,
    privateKey,
    encryptedPublicKey: JSON.stringify(encryptedPublicKeyForResponse),
  });

  return config;
});

apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    const rsaStore = encryptionStore;
    const request = response.config as AxiosRequestConfig;

    if (response.data) {
      const publicKeyForResponseHeader =
        request.headers?.[RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER];
      const aesEncryptionKeyForPublicKey =
        response.headers?.[RESPONSE_BODY_ENCRYPTION_KEY_HEADER];

      const keyPairEncryptedKey = rsaStore.keys?.find(
        (key) => key.encryptedPublicKey === publicKeyForResponseHeader,
      );
      if (!keyPairEncryptedKey) {
        return Promise.reject(
          new Error(
            "Failed to find matching RSA key pair for response decryption",
          ),
        );
      }

      const decryptedAesKeyForPublicKey = decryptAESKeyWithRSA_WebCryptoStyle(
        aesEncryptionKeyForPublicKey as string,
        keyPairEncryptedKey.privateKey,
      );

      const keyPair = keyPairEncryptedKey;

      if (keyPair) {
        const decryptedResponse = decrypt(
          response.data,
          decryptedAesKeyForPublicKey,
        );

        response.data = JSON.parse(decryptedResponse);
        rsaStore.removeKeyWithPrivateKey(keyPair.privateKey);
      } else {
        return Promise.reject(
          new Error(
            "Failed to find matching RSA key pair for response decryption",
          ),
        );
      }
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized - clearing encryption keys");
    }

    return Promise.reject(error);
  },
);
