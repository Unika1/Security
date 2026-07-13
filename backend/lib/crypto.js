import crypto from "crypto";

/*
  AES-256 encryption for personal data stored in the database.

  Some user details (e.g. a phone number) are sensitive. If the database were
  ever leaked, plaintext personal data would be exposed. We therefore encrypt
  these fields at rest with AES-256-GCM and only decrypt them when the owner
  reads their own profile.

  The key comes from CRYPTO_SECRET in .env (never committed). A fresh random
  IV is generated per value and stored alongside the ciphertext, so encrypting
  the same value twice produces different output.
*/

const ALGO = "aes-256-gcm";

// Derive a stable 32-byte key from the secret in the environment.
function getKey() {
  const secret = process.env.CRYPTO_SECRET || "dev-only-crypto-secret-change-me";
  return crypto.createHash("sha256").update(secret).digest();
}

// Encrypt a string. Output format: "iv:authTag:ciphertext" (all hex).
export function encrypt(plainText) {
  if (!plainText) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

// Decrypt a value produced by encrypt(). Returns "" if it can't be decoded.
export function decrypt(stored) {
  if (!stored) return "";
  try {
    const [ivHex, tagHex, dataHex] = stored.split(":");
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}
