import crypto from "crypto";

// AES encryption for personal data like the phone number.
// We store it encrypted so it is not readable if the database is stolen.
// The secret key is kept in the .env file.

const ALGO = "aes-256-gcm";

// Build a 32 byte key from the secret in .env.
function getKey() {
  const secret = process.env.CRYPTO_SECRET || "dev-only-crypto-secret-change-me";
  return crypto.createHash("sha256").update(secret).digest();
}

// Encrypt a string. The result looks like "iv:authTag:ciphertext".
export function encrypt(plainText) {
  if (!plainText) return "";

  // 1. Make a random IV. This makes the output different every time.
  const iv = crypto.randomBytes(12);

  // 2. Create the cipher using our key and the IV.
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);

  // 3. Encrypt the text into hex.
  let encrypted = cipher.update(String(plainText), "utf8", "hex");
  encrypted = encrypted + cipher.final("hex");

  // 4. Get the auth tag. It is used later to check the data was not changed.
  const authTag = cipher.getAuthTag().toString("hex");

  // 5. Join the three parts with ":" so we can split them again later.
  return iv.toString("hex") + ":" + authTag + ":" + encrypted;
}

// Turn an encrypted value back into normal text. Returns "" if it fails.
export function decrypt(stored) {
  if (!stored) return "";

  try {
    // 1. Split the stored value back into its three parts.
    const parts = stored.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];

    // 2. Create the decipher using the same key and IV.
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(authTag);

    // 3. Decrypt the text back to normal.
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted = decrypted + decipher.final("utf8");

    return decrypted;
  } catch {
    // If the data is broken or the key is wrong, just return empty.
    return "";
  }
}
