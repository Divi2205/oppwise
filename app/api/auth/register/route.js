import { handler, json, readJson } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { hashPassword, createSession, HttpError } from "@/lib/auth";
import { one } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const POST = handler(async (req) => {
  if (!rateLimit(`register:${clientIp(req)}`, { limit: 10, windowMs: 10 * 60_000 }).ok) throw new HttpError(429, "Too many attempts. Try again in a few minutes.");
  const data = registerSchema.parse(await readJson(req));
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "srmist.edu.in").toLowerCase();
  if (!data.email.endsWith("@" + domain)) {
    throw new HttpError(400, "Please fix the highlighted fields", { fields: { email: `Use your college email (@${domain})` } });
  }
  const exists = await one("SELECT 1 FROM users WHERE email = $1", [data.email]);
  if (exists) throw new HttpError(409, "Please fix the highlighted fields", { fields: { email: "An account with this email already exists" } });
  const user = await one(
    `INSERT INTO users (name, email, password_hash, year, branch) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [data.name, data.email, await hashPassword(data.password), data.year, data.branch]
  );
  await createSession(user.id);
  return json({ ok: true }, 201);
});
