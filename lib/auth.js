// Session auth: bcrypt-hashed passwords + a signed JWT in an httpOnly cookie.
// Roles are always re-read from the database, never trusted from the browser.
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { one, databaseUrl } from "./db.js";

const COOKIE = "oppwise_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return new TextEncoder().encode(s);
  // Random per-deployment key generated at build time (see next.config.js); server-only.
  const built = process.env.OPPWISE_BUILD_SECRET;
  if (built && built.length >= 16) return new TextEncoder().encode(built);
  // No SESSION_SECRET set: derive one from the database URL (which contains the DB password
  // and is never sent to browsers), so a fresh deployment works with only DATABASE_URL.
  const url = databaseUrl();
  if (url) return new TextEncoder().encode(createHash("sha256").update("oppwise-session:" + url).digest("hex"));
  return new TextEncoder().encode("dev-only-secret-change-me-please-0123456789");
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

export async function createSession(userId) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export const USER_COLS = "id, name, email, role, year, branch, cgpa, skills, approved_count, rejected_count";

export async function getUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return await one(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [Number(payload.sub)]);
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export async function requireUser() {
  const u = await getUser();
  if (!u) throw new HttpError(401, "Please log in first");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") throw new HttpError(403, "Admins only");
  return u;
}
