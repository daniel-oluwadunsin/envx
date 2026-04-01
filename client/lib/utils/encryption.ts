// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary = window.atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

function stringToArrayBuffer(str: string) {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

function arrayBufferToString(buffer: ArrayBuffer) {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256, // AES-256
    },
    true, // extractable
    ["encrypt", "decrypt"],
  );
}

function pemToArrayBuffer(pem: string) {
  // remove header, footer, newlines
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importRSAPublicKey(pem: string) {
  const buffer = pemToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
}

// AES-GCM encryption
export async function encryptAES(plainText: string, key: CryptoKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  // AES-GCM appends a 16-byte auth tag at the end
  const tagLength = 16;
  const ciphertextBytes = encryptedBytes.slice(
    0,
    encryptedBytes.length - tagLength,
  );
  const authTagBytes = encryptedBytes.slice(encryptedBytes.length - tagLength);

  return {
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(ciphertextBytes.buffer),
    authTag: arrayBufferToBase64(authTagBytes.buffer),
  };
}
export async function decryptAES(
  payload: { iv: string; data: string; authTag: string },
  key: CryptoKey,
) {
  const decoder = new TextDecoder();
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = new Uint8Array(base64ToArrayBuffer(payload.data));
  const authTag = new Uint8Array(base64ToArrayBuffer(payload.authTag));

  // Re-append auth tag to ciphertext before decryption
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined.buffer,
  );

  return decoder.decode(decryptedBuffer);
}

export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable: true if you want to export keys
    ["encrypt", "decrypt"],
  );

  const publicKey = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey,
  );
  const privateKey = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey,
  );

  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
  };
}

// public key is in normal string not base64 format, so we need to convert it to ArrayBuffer before importing
export async function encryptAESKeyWithRSA(
  aesKey: CryptoKey,
  publicKeyString: string,
) {
  const publicKeyBuffer = pemToArrayBuffer(publicKeyString);
  const importedPublicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"],
  );

  const aesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    importedPublicKey,
    aesKeyBuffer,
  );

  return arrayBufferToBase64(encryptedAesKeyBuffer);
}

export async function decryptAESKeyWithRSA(
  encryptedAesKey: string,
  privateKeyString: string,
) {
  const privateKeyBuffer = pemToArrayBuffer(privateKeyString);

  const importedPrivateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"],
  );

  const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedAesKey);
  const decryptedAesKeyBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    importedPrivateKey,
    encryptedAesKeyBuffer,
  );

  const decryptedKeyString = arrayBufferToString(decryptedAesKeyBuffer);

  // Step 2: convert Base64 string back to raw bytes
  const aesKeyBuffer = base64ToArrayBuffer(decryptedKeyString);

  return await window.crypto.subtle.importKey(
    "raw",
    aesKeyBuffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function decryptStringWithRSA(
  encryptedString: string,
  privateKeyString: string,
) {
  const privateKeyBuffer = pemToArrayBuffer(privateKeyString);
  const importedPrivateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"],
  );

  const encryptedBuffer = base64ToArrayBuffer(encryptedString);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    importedPrivateKey,
    encryptedBuffer,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
