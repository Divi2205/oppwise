import { handler, json, readJson } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSession, HttpError } from "@/lib/auth";
import { one } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const POST = handler(async (req) => {
  const rl = rateLimit(`login:${clientIp(req)}`, { limit: 10, windowMs: 10 * 60_000 });
  if (!rl.ok) throw new HttpError(429, `Too many login attempts. Try again in ${rl.retryAfter}s.`);
  const { email, password } = loginSchema.parse(await readJson(req));
  const user = await one("SELECT id, password_hash FROM users WHERE email = $1", [email]);
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await verifyPassword(password, user.password_hash))) throw new HttpError(401, "Email or password is incorrect");
  await createSession(user.id);
  return json({ ok: true });
});
