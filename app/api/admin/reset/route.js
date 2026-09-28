import { handler, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { initDatabase } from "@/lib/seed";

// Rebuilds the demo data with fresh dates (useful right before a presentation).
export const POST = handler(async () => {
  await requireAdmin();
  await initDatabase(await getDb(), { reset: true });
  return json({ ok: true });
});
