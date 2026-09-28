import { handler, json, readJson } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { previewImport } from "@/lib/opportunities";
import { importSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";

// Shows what the parser understood — nothing is saved yet.
export const POST = handler(async (req) => {
  const user = await requireUser();
  if (!rateLimit(`preview:${user.id}`, { limit: 60, windowMs: 10 * 60_000 }).ok) throw new HttpError(429, "Slow down a little and try again shortly.");
  const { text, url } = importSchema.parse(await readJson(req));
  return json(await previewImport(text, url));
});
