import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "./crypto";
import { SessionUser } from "./rbac";

const COOKIE_NAME = "leadyfy_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "leadyfy-os-super-secret-jwt-key-development-2026";

/**
 * Retrieves the current authenticated user session from HTTP cookies.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(COOKIE_NAME);
  if (!tokenCookie || !tokenCookie.value) return null;

  return verifySessionToken<SessionUser>(tokenCookie.value, AUTH_SECRET);
}

/**
 * Sets session cookie after successful login.
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = createSessionToken(user, AUTH_SECRET);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clears session cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Helper to require an active session or throw an unauthorized error.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    const error = new Error("Unauthorized: Please log in to proceed.");
    (error as any).statusCode = 401;
    throw error;
  }
  return session;
}
