import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { useUserStore } from "../store/user.store";
import { toast } from "sonner";
import {
  decryptAES,
  decryptStringWithRSA,
  encryptAES,
  encryptAESKeyWithRSA,
  generateAESKey,
  generateRSAKeyPair,
} from "../utils/encryption";
import { useRSAKeysStore } from "../store/rsa-keys.store";
/**
 * For requests
 * Encrypts data using AES-GCM with a given key and IV.
 * @param {string} plainText - The data to encrypt.
 * @param {CryptoKey} key - The AES key for encryption.
 * @returns {Promise<{ iv: string; data: string }>} An object containing the IV and encrypted data in Base64 format.
 *
 * Encrypt aes key with rsa public key before sending to server (X-Encryption Key)
 *
 */

/**
 * For responses, for every request, generate a private public key pair and send the public key to the server (X-Public-Key). The server will encrypt the response data with the public key and send it back. The client will decrypt the response data with the private key.
 * Decrypts data using AES-GCM with a given key and IV.
 * @param {string} encryptedData - The encrypted data in Base64 format.
 * @param {string} ivBase64 - The initialization vector in Base64 format.
 * @param {CryptoKey} key - The AES key for decryption.
 * @returns {Promise<string>} The decrypted plain text.
 */

const REQUEST_BODY_ENCRYPTION_KEY_REQUEST_HEADER =
  "X-Request-Body-Encryption-Key";
const RESPONSE_BODY_ENCRYPTION_KEY_HEADER = "X-Response-Body-Encryption-Key";
const RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER =
  "X-Response-Body-Public-Key-Encryption-Key";
const ENCRYPTION_PUBLIC_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY!;

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const { accessToken } = useUserStore.getState();
  const rsaStore = useRSAKeysStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (config.data) {
    // Generate AES key and IV
    const aesKey = await generateAESKey();
    const encryptedData = await encryptAES(JSON.stringify(config.data), aesKey);

    config.data = encryptedData;

    const encryptedAesKey = await encryptAESKeyWithRSA(
      aesKey,
      ENCRYPTION_PUBLIC_KEY,
    );

    config.headers[REQUEST_BODY_ENCRYPTION_KEY_REQUEST_HEADER] =
      encryptedAesKey;
  }

  // encryption key for response
  const { publicKey, privateKey } = await generateRSAKeyPair();
  rsaStore.setKey({ publicKey, privateKey });

  const aesKeyForResponse = await generateAESKey();

  const encryptedPublicKeyForResponse = await encryptAES(
    publicKey,
    aesKeyForResponse,
  );

  const encryptedAesKeyForResponse = await encryptAESKeyWithRSA(
    aesKeyForResponse,
    ENCRYPTION_PUBLIC_KEY,
  );

  config.headers[RESPONSE_BODY_ENCRYPTION_KEY_HEADER] =
    encryptedAesKeyForResponse;

  config.headers[RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER] =
    JSON.stringify(encryptedPublicKeyForResponse);

  return config;
});

const authRoutes = ["/dashboard", "/org", "project"];

apiClient.interceptors.response.use(
  async (config: AxiosResponse) => {
    const rsaStore = useRSAKeysStore.getState();
    const request = config.request as AxiosRequestConfig;

    if (config.data) {
      const publicKeyForResponseHeader =
        request.headers?.[RESPONSE_BODY_PUBLIC_KEY_ENCRYPTION_KEY_HEADER];
      const aesEncryptionKeyForPublicKey =
        request.headers?.[RESPONSE_BODY_ENCRYPTION_KEY_HEADER];

      const encryptedPublicKeyForResponse = JSON.parse(
        publicKeyForResponseHeader,
      );

      const decryptedPublicKeyForResponse = await decryptAES(
        encryptedPublicKeyForResponse,
        aesEncryptionKeyForPublicKey,
      );

      const keyPair = rsaStore.keys?.find(
        (key) => key.publicKey === decryptedPublicKeyForResponse,
      );

      if (keyPair) {
        const decryptedResponse = await decryptStringWithRSA(
          config.data,
          keyPair.privateKey,
        );

        config.data = JSON.parse(decryptedResponse);
        rsaStore.removeKeyWithPrivateKey(keyPair.privateKey);
      } else {
        return Promise.reject(
          new Error(
            "Failed to find matching RSA key pair for response decryption",
          ),
        );
      }
    }

    return config;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (
        authRoutes.some((route) => window.location.pathname.startsWith(route))
      ) {
        useUserStore.getState().clearUser();
        toast.error("Unauthorized", {
          description: "Your session has expired. Please sign in again.",
        });
        window.location.href = "/signin";
      }
    }

    return Promise.reject(error);
  },
);
