// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive encryption key from password using PBKDF2
export async function deriveKey(password: string, salt: Uint8Array, iterations: number = 100000): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

// Generate random salt
export function generateSalt(length: number = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

// Encrypt plaintext note
export async function encryptNote(plaintext: string, key: CryptoKey, userId: number, noteId: number): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Prepare Additional Authenticated Data
  const aad = encoder.encode(JSON.stringify({ userId, noteId }));
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: aad,
      tagLength: 128
    },
    key,
    encoder.encode(plaintext)
  );
  
  // Extract auth tag (last 16 bytes)
  const authTag = ciphertext.slice(-16);
  const actualCiphertext = ciphertext.slice(0, -16);
  
  return {
    ciphertext: arrayBufferToBase64(actualCiphertext),
    iv: arrayBufferToBase64(iv as unknown as ArrayBuffer),
    authTag: arrayBufferToBase64(authTag)
  };
}

// Decrypt encrypted note
export async function decryptNote(encryptedData: EncryptedData, key: CryptoKey, userId: number, noteId: number): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const { ciphertext, iv, authTag } = encryptedData;
  
  // Reconstruct AAD (must match encryption)
  const aad = encoder.encode(JSON.stringify({ userId, noteId }));
  
  // Concatenate ciphertext + auth tag
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const authTagBuffer = base64ToArrayBuffer(authTag);
  const combined = new Uint8Array(
    ciphertextBuffer.byteLength + authTagBuffer.byteLength
  );
  combined.set(new Uint8Array(ciphertextBuffer), 0);
  combined.set(new Uint8Array(authTagBuffer), ciphertextBuffer.byteLength);
  
  try {
    // Decrypt (automatically verifies auth tag)
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(iv),
        additionalData: aad,
        tagLength: 128
      },
      key,
      combined
    );
    
    return decoder.decode(plaintext);
    
  } catch (error) {
    throw new Error('Integrity check failed - data may be tampered');
  }
}
