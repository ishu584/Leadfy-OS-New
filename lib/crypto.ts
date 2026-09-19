import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Hashes a plain text password using bcrypt with salt rounds of 10.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies a plain text password against a hashed password.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a signed session token.
 */
export function createSessionToken(payload: Record<string, any>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

/**
 * Verifies and decodes a signed session token.
 */
export function verifySessionToken<T = any>(token: string, secret: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${data}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload as T;
  } catch {
    return null;
  }
}
