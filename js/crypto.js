// Browser-side PBKDF2 + AES-GCM helpers, mirroring build/encrypt.js exactly.
const SALT_LEN = 16;
const IV_LEN = 12;

export function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function deriveKey(normalizedAnswer, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(normalizedAnswer),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 250000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

// encryptedBuf: salt(16) || iv(12) || ciphertext+tag
// saltBase64: the base64-encoded salt from the manifest (used for key derivation — same salt)
// We re-derive the key each call; callers should cache the key if decrypting multiple blobs.
export async function decryptBlob(encryptedBuf, key) {
  const data = new Uint8Array(encryptedBuf);
  // salt is embedded but key is already derived; skip salt(16), read iv(12), then ciphertext
  const iv = data.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const ciphertext = data.slice(SALT_LEN + IV_LEN);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
}

export async function deriveKeyFromManifest(answer, manifest) {
  const saltBytes = Uint8Array.from(atob(manifest.salt), c => c.charCodeAt(0));
  return deriveKey(normalizeAnswer(answer), saltBytes);
}
