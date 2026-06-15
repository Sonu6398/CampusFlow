import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { store } from "./store";
import type { PublicUser, User } from "./types";

export const SESSION_COOKIE = "cf_session";
const SECRET = process.env.SESSION_SECRET || "dev-only-campusflow-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/** token = base64url(userId).hmac  */
export function signSession(userId: string): string {
  const payload = Buffer.from(userId).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  return Buffer.from(payload, "base64url").toString("utf8");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

/** Read the logged-in user's id from the request cookies (server side). */
export function currentUserId(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function currentUser(): Promise<PublicUser | null> {
  const id = currentUserId();
  if (!id) return null;
  const user = await store().getUserByEmail(id);
  if (!user) return null;
  return toPublic(user);
}

export function toPublic(user: User): PublicUser {
  const { passwordHash, ...rest } = user;
  return rest;
}
