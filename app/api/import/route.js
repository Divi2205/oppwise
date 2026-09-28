import { handler, json, readJson } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { runImport } from "@/lib/opportunities";
import { importSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";

// Runs the full pipeline: parse -> scam check -> duplicate check -> auto-moderation -> save.
export const POST = handler(async (req) => {
  const user = await requireUser();
  const rl = rateLimit(`import:${user.id}`, { limit: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) throw new HttpError(429, `You've imported a lot recently. Try again in ${rl.retryAfter}s.`);
  const { text, url, source, overrides } = importSchema.parse(await readJson(req));
  const result = await runImport({ text, url, source, overrides, user });
  return json(result, result.status === "rejected" ? 422 : 201);
});
