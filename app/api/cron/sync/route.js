import { handler, json } from "@/lib/api";
import { HttpError } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called once a day by Vercel Cron (see vercel.json).
// With CRON_SECRET set, only Vercel's scheduler (which sends it as a Bearer token) may run it.
// Without it, anyone may trigger it, but at most once every 6 hours.
export const GET = handler(async (req) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) throw new HttpError(401, "Unauthorised");
  } else {
    const recent = await one(`SELECT 1 FROM sync_runs WHERE ran_at > now() - interval '6 hours' LIMIT 1`);
    if (recent) return json({ skipped: true, reason: "Synced within the last 6 hours" });
  }
  return json({ results: await runSync(query) });
});
