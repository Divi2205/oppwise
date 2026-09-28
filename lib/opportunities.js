// Data access for opportunities + the import pipeline:
// parse -> scam check -> duplicate check -> auto-moderation -> save.
import { query, one } from "./db.js";
import { parseOpportunity } from "./parser.js";
import { checkScam } from "./scam.js";
import { dedupKey } from "./dedup.js";
import { decide } from "./moderation.js";
import { computeVerdict } from "./verdict.js";
import { today } from "./dates.js";

export const OPP_COLS = `o.id, o.title, o.org, o.type, o.description, o.link,
  o.deadline::text AS deadline, o.event_start::text AS event_start, o.event_end::text AS event_end,
  o.mode, o.reward, o.eligible_years, o.eligible_branches, o.min_cgpa, o.skills, o.source, o.status,
  o.scam_level, o.scam_flags, o.confidence, o.review_reasons, o.dup_count, o.report_count, o.submitted_by, o.created_at`;

export async function getCalendar() {
  return query(`SELECT id, title, kind, start_date::text AS start_date, end_date::text AS end_date
                FROM calendar_events ORDER BY start_date`);
}

export async function listOpportunities({ userId = null, q = "", type = "", skill = "", within = "", source = "", status = "published", includePast = false } = {}) {
  const params = [status];
  const where = ["o.status = $1"];
  const p = (v) => { params.push(v); return `$${params.length}`; }; // always parameterised
  if (!includePast) where.push(`(o.deadline IS NULL OR o.deadline >= ${p(today())}::date)`);
  if (q) {
    const ph = p(`%${q}%`);
    where.push(`(o.title ILIKE ${ph} OR o.org ILIKE ${ph} OR o.description ILIKE ${ph})`);
  }
  if (type) where.push(`o.type = ${p(type)}`);
  if (source === "campus") where.push(`o.source NOT IN ('unstop','devfolio')`);
  else if (source) where.push(`o.source = ${p(source)}`);
  if (skill) where.push(`o.skills @> ${p(JSON.stringify([skill]))}::jsonb`);
  if (within) where.push(`o.deadline <= ${p(today())}::date + ${p(Number(within))}::int`);
  const uid = p(userId);
  return query(
    `SELECT ${OPP_COLS}, b.status AS my_status, u.name AS submitted_by_name,
            (SELECT count(*)::int FROM bookmarks bb WHERE bb.opp_id = o.id) AS bookmark_count
     FROM opportunities o
     LEFT JOIN bookmarks b ON b.opp_id = o.id AND b.user_id = ${uid}
     LEFT JOIN users u ON u.id = o.submitted_by
     WHERE ${where.join(" AND ")}
     ORDER BY o.deadline ASC NULLS LAST, o.created_at DESC
     LIMIT 200`,
    params
  );
}

export async function getOpportunity(id, userId = null) {
  return one(
    `SELECT ${OPP_COLS}, b.status AS my_status, b.note AS my_note,
            (SELECT count(*)::int FROM bookmarks bb WHERE bb.opp_id = o.id) AS bookmark_count,
            u.name AS submitted_by_name
     FROM opportunities o
     LEFT JOIN bookmarks b ON b.opp_id = o.id AND b.user_id = $2
     LEFT JOIN users u ON u.id = o.submitted_by
     WHERE o.id = $1`,
    [id, userId]
  );
}

export function withVerdicts(opps, user, calendar) {
  const t = today();
  return opps.map((o) => ({ ...o, verdict: computeVerdict(user, o, calendar, t) }));
}

// Insert, or merge into an existing listing with the same dedup key (DB-enforced UNIQUE).
export async function saveOpportunity(f, meta, exec = one) {
  const key = dedupKey({ link: f.link, title: f.title, org: f.org, deadline: f.deadline });
  const row = await exec(
    `INSERT INTO opportunities
       (title, org, type, description, link, deadline, event_start, event_end, mode, reward,
        eligible_years, eligible_branches, min_cgpa, skills, source, status, scam_level, scam_flags,
        confidence, review_reasons, dedup_key, submitted_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14::jsonb,$15,$16,$17,$18::jsonb,$19::jsonb,$20::jsonb,$21,$22)
     ON CONFLICT (dedup_key) DO UPDATE SET dup_count = opportunities.dup_count + 1
     RETURNING id, status, (xmax = 0) AS inserted`,
    [
      f.title, f.org, f.type, f.description || "", f.link, f.deadline, f.eventStart, f.eventEnd, f.mode, f.reward,
      JSON.stringify(f.eligibleYears || []), JSON.stringify(f.eligibleBranches || []), f.minCgpa, JSON.stringify(f.skills || []),
      meta.source, meta.status, meta.scam.level, JSON.stringify(meta.scam.flags), JSON.stringify(meta.confidence || {}),
      JSON.stringify(meta.reasons || []), key, meta.submittedBy,
    ]
  );
  return { id: row.id, status: row.status, merged: !row.inserted };
}

export async function findDuplicate(fields) {
  const key = dedupKey({ link: fields.link, title: fields.title, org: fields.org, deadline: fields.deadline });
  if (!key) return null;
  return one(`SELECT id, title, status, dup_count FROM opportunities WHERE dedup_key = $1`, [key]);
}

// Preview: what the parser understood, before anything is saved.
export async function previewImport(text, url) {
  const parsed = parseOpportunity(text, { url });
  const scam = checkScam(text, parsed.links);
  const duplicate = await findDuplicate(parsed.fields);
  return { ...parsed, scam, duplicate };
}

// Full pipeline used by paste, share, poster and the college inbox.
export async function runImport({ text, url, source, overrides, user }) {
  const parsed = parseOpportunity(text, { url });
  const fields = { ...parsed.fields };
  const confidence = { ...parsed.confidence };
  // Fields the person confirmed or corrected on the preview screen count as certain.
  for (const [k, v] of Object.entries(overrides || {})) {
    if (v === undefined) continue;
    fields[k] = v;
    if (k in confidence && v !== null && v !== "") confidence[k] = "high";
  }
  const scam = checkScam(text, parsed.links);
  const { status, reasons } = decide({ fields, confidence, scam, source, submitter: user });
  if (status === "rejected") return { status, reasons, id: null, merged: false, scam };
  const saved = await saveOpportunity(fields, { source, status, scam, confidence, reasons, submittedBy: user?.id ?? null });
  return { ...saved, reasons: saved.merged ? [] : reasons, scam };
}

export async function recordModeration(ids, action) {
  const status = action === "approve" ? "published" : "rejected";
  const rows = await query(
    `UPDATE opportunities SET status = $1, review_reasons = '[]'::jsonb
     WHERE id = ANY($2::int[]) AND status = 'pending' RETURNING id, submitted_by`,
    [status, `{${ids.join(",")}}`]
  );
  // Feed the trusted-contributor rule.
  const col = action === "approve" ? "approved_count" : "rejected_count";
  for (const r of rows) if (r.submitted_by) await query(`UPDATE users SET ${col} = ${col} + 1 WHERE id = $1 AND role = 'student'`, [r.submitted_by]);
  return rows.length;
}
