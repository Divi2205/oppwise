import { handler, json, readJson } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { bookmarkSchema } from "@/lib/validation";
import { one } from "@/lib/db";

async function publishedId(params) {
  const id = Number(params.id);
  const opp = Number.isInteger(id) ? await one(`SELECT id FROM opportunities WHERE id=$1 AND status IN ('published','archived')`, [id]) : null;
  if (!opp) throw new HttpError(404, "Opportunity not found");
  return id;
}

// PUT = save, or move along the pipeline / update the note
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser();
  const id = await publishedId(params);
  const { status, note } = bookmarkSchema.parse(await readJson(req));
  const row = await one(
    `INSERT INTO bookmarks (user_id, opp_id, status, note) VALUES ($1, $2, COALESCE($3, 'interested'), COALESCE($4, ''))
     ON CONFLICT (user_id, opp_id) DO UPDATE
       SET status = COALESCE($3, bookmarks.status), note = COALESCE($4, bookmarks.note), updated_at = now()
     RETURNING status, note`,
    [user.id, id, status ?? null, note ?? null]
  );
  return json({ bookmark: row });
});

export const DELETE = handler(async (_req, { params }) => {
  const user = await requireUser();
  await one(`DELETE FROM bookmarks WHERE user_id=$1 AND opp_id=$2 RETURNING opp_id`, [user.id, Number(params.id)]);
  return json({ ok: true });
});
