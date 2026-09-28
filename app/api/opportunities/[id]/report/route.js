import { handler, json, readJson } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";
import { one } from "@/lib/db";
import { COMMUNITY_REPORT_LIMIT } from "@/lib/moderation";

// Community flags: after enough reports, a listing is hidden until the admin reviews it.
export const POST = handler(async (req, { params }) => {
  const user = await requireUser();
  const id = Number(params.id);
  const { reason } = reportSchema.parse(await readJson(req));
  const opp = Number.isInteger(id) ? await one(`SELECT id FROM opportunities WHERE id=$1 AND status='published'`, [id]) : null;
  if (!opp) throw new HttpError(404, "Opportunity not found");
  const inserted = await one(
    `INSERT INTO reports (user_id, opp_id, reason) VALUES ($1,$2,$3) ON CONFLICT (user_id, opp_id) DO NOTHING RETURNING opp_id`,
    [user.id, id, reason]
  );
  if (!inserted) return json({ ok: true, alreadyReported: true });
  const row = await one(`UPDATE opportunities SET report_count = report_count + 1 WHERE id=$1 RETURNING report_count`, [id]);
  let hidden = false;
  if (row.report_count >= COMMUNITY_REPORT_LIMIT) {
    await one(
      `UPDATE opportunities SET status='pending', review_reasons = review_reasons || $2::jsonb WHERE id=$1 RETURNING id`,
      [id, JSON.stringify([`Reported by ${row.report_count} students — latest: "${reason}"`])]
    );
    hidden = true;
  }
  return json({ ok: true, hidden });
});
