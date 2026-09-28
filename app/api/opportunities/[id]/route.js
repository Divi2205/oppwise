import { handler, json, readJson } from "@/lib/api";
import { requireUser, requireAdmin, HttpError } from "@/lib/auth";
import { getOpportunity, getCalendar, withVerdicts } from "@/lib/opportunities";
import { opportunitySchema } from "@/lib/validation";
import { dedupKey } from "@/lib/dedup";
import { checkScam } from "@/lib/scam";
import { one } from "@/lib/db";

const idOf = (params) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, "Not found");
  return id;
};

export const GET = handler(async (_req, { params }) => {
  const user = await requireUser();
  const opp = await getOpportunity(idOf(params), user.id);
  if (!opp || (opp.status !== "published" && user.role !== "admin" && opp.submitted_by !== user.id)) throw new HttpError(404, "Not found");
  const [item] = withVerdicts([opp], user, await getCalendar());
  return json({ item });
});

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin();
  const id = idOf(params);
  const f = opportunitySchema.parse(await readJson(req));
  const scam = checkScam(`${f.title}\n${f.description}`, f.link ? [f.link] : []);
  const row = await one(
    `UPDATE opportunities SET title=$1, org=$2, type=$3, description=$4, link=$5, deadline=$6, event_start=$7, event_end=$8,
       mode=$9, reward=$10, eligible_years=$11::jsonb, eligible_branches=$12::jsonb, min_cgpa=$13, skills=$14::jsonb,
       scam_level=$15, scam_flags=$16::jsonb, dedup_key=$17, confidence='{}'::jsonb
     WHERE id=$18 RETURNING id`,
    [f.title, f.org, f.type, f.description, f.link, f.deadline, f.eventStart, f.eventEnd, f.mode, f.reward,
     JSON.stringify(f.eligibleYears), JSON.stringify(f.eligibleBranches), f.minCgpa, JSON.stringify(f.skills),
     scam.level, JSON.stringify(scam.flags), dedupKey(f), id]
  );
  if (!row) throw new HttpError(404, "Not found");
  return json({ ok: true, id });
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin();
  const row = await one(`UPDATE opportunities SET status='archived' WHERE id=$1 RETURNING id`, [idOf(params)]);
  if (!row) throw new HttpError(404, "Not found");
  return json({ ok: true });
});
