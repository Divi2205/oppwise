import { handler, json } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth";
import { one } from "@/lib/db";

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin();
  const row = await one(`DELETE FROM calendar_events WHERE id=$1 RETURNING id`, [Number(params.id)]);
  if (!row) throw new HttpError(404, "Not found");
  return json({ ok: true });
});
