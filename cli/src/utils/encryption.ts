import crypto, { generateKeyPairSync } from "crypto";

export function generateAesKey(): Buffer {
  return crypto.randomBytes(32);
}

function isBase64String(str: string): boolean {
  // Base64 characters: A-Z, a-z, 0-9, +, /, optional padding =
  const base64Regex =
    /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
  return base64Regex.test(str);
}

function base64ToPEM(base64Key: string): string {
  const formatted = base64Key.match(/.{1,64}/g)?.join("\n"); // split lines
  return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`;
}

export function encrypt(
  text: string | Buffer,
  key: Buffer | string,
): { iv: string; data: string; authTag: string } {
  key = typeof key === "string" ? Buffer.from(key, "base64") : key;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(typeof text === "string" ? Buffer.from(text, "utf8") : text),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    data: encrypted.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decrypt(
  encrypted: { iv: string; data: string; authTag: string },
  key: Buffer | string,
): string {
  key = typeof key === "string" ? Buffer.from(key, "base64") : key;
  const iv = Buffer.from(encrypted.iv, "base64");
  const authTag = Buffer.from(encrypted.authTag, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.data, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function decryptWithPrivateKey(
  encryptedData: string,
  privateKey: string,
) {
  const buffer = Buffer.from(encryptedData, "base64");

  const decryptedData = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer,
  );

  return decryptedData;
}

export function decryptAESKeyWithRSA_WebCryptoStyle(
  encryptedAesKey: string,
  privateKey: string,
): Buffer {
  const encryptedBuffer = Buffer.from(encryptedAesKey, "base64");

  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedBuffer,
  );

  const decryptedKeyString = decryptedBuffer.toString("utf-8");

  const aesKeyBuffer = Buffer.from(decryptedKeyString, "base64");

  return aesKeyBuffer;
}

export function encryptWithPublicKey(
  data: string | Buffer,
  publicKey: string,
): string {
  const pemKey = isBase64String(publicKey) ? base64ToPEM(publicKey) : publicKey;
  const buffer = typeof data === "string" ? Buffer.from(data, "utf-8") : data;

  const encryptedData = crypto.publicEncrypt(
    {
      key: pemKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer,
  );

  return encryptedData.toString("base64");
}

export function signWithPrivateKey(data: string, privateKey: string): string {
  const buffer = Buffer.from(data, "utf-8");

  const signature = crypto.sign("sha256", buffer, {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return signature.toString("base64");
}

export function verifyWithPublicKey(
  data: string,
  signature: string,
  publicKey: string,
): boolean {
  const buffer = Buffer.from(data, "utf-8");
  const signatureBuffer = Buffer.from(signature, "base64");

  const verify = crypto.createVerify("sha256");
  verify.update(buffer);
  verify.end();

  return verify.verify(publicKey, signatureBuffer);
}

export function generateRSAKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}
