import { handler, json } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth";
import { query } from "@/lib/db";
import { runSync, lastRuns } from "@/lib/sync";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = handler(async () => {
  await requireAdmin();
  return json({ runs: await lastRuns(query) });
});

// "Sync now" from the admin page.
export const POST = handler(async () => {
  const admin = await requireAdmin();
  if (!rateLimit(`sync:${admin.id}`, { limit: 5, windowMs: 10 * 60_000 }).ok) throw new HttpError(429, "Synced recently. Try again in a few minutes.");
  const results = await runSync(query);
  return json({ results });
});
