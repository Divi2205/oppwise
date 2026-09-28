// Automatic sync from Unstop and Devfolio.
// Neither site offers an official public API, so this reads the same public listing JSON
// their own websites use. To stay respectful: it runs at most once a day (plus an admin
// "Sync now"), keeps only the basics (title, organiser, dates, mode, link) and always links
// back to the original page, where students actually register.
// If a site can't be reached, a saved snapshot is used so the feed is never empty.
import { extractSkills } from "./skills.js";
import { checkScam } from "./scam.js";
import { dedupKey } from "./dedup.js";
import { today } from "./dates.js";

const UA = "Mozilla/5.0 (compatible; OppWise/1.0; student project; +https://oppwise-srm.vercel.app)";
const UNSTOP_KINDS = [
  { kind: "hackathons", type: "hackathon", limit: 10 },
  { kind: "internships", type: "internship", limit: 6 },
  { kind: "competitions", type: "competition", limit: 5 },
];
const DEVFOLIO_LIMIT = 10;
export const SYNC_SOURCES = ["unstop", "devfolio"];
export const SOURCE_LABEL = { unstop: "Unstop", devfolio: "Devfolio" };

const clean = (s, max = 140) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);
const istDate = (iso) => {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // calendar date in India
};
const MODE = { online: "online", offline: "offline", hybrid: "hybrid" };
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

// ---- mapping (pure, unit-tested) ----
export function mapUnstop(x, type) {
  const title = clean(x.title);
  if (!title) return null;
  const skillsText = (x.required_skills || []).map((s) => s.skill_name || s.skill || "").join(", ");
  let reward = null;
  const cash = (x.prizes || []).reduce((sum, p) => sum + (Number(p.cash) || 0), 0);
  if (cash > 0) reward = `Prizes worth ${money(cash)}`;
  const jd = x.jobDetail || x.job_detail;
  if (!reward && jd && jd.show_salary && jd.max_salary) {
    reward = jd.min_salary && jd.min_salary !== jd.max_salary ? `Stipend ${money(jd.min_salary)}–${money(jd.max_salary)}` : `Stipend ${money(jd.max_salary)}`;
  }
  const city = (x.locations || []).map((l) => l.city).filter(Boolean)[0];
  return {
    title,
    org: clean(x.organisation?.name, 100) || null,
    type,
    link: x.seo_url || (x.public_url ? `https://unstop.com/${x.public_url}` : null),
    deadline: istDate(x.regnRequirements?.end_regn_dt || x.end_date),
    eventStart: null,
    eventEnd: null,
    mode: MODE[x.region] || null,
    reward,
    eligibleYears: [],
    eligibleBranches: [],
    minCgpa: null,
    skills: extractSkills(`${title}. ${skillsText}`),
    description: `Listed on Unstop${city ? ` · ${city}` : ""}. Register on the original page.`,
  };
}

export function mapDevfolio(s) {
  const title = clean(s.name);
  if (!title || !s.slug) return null;
  const set = s.hackathon_setting || {};
  const themes = (s.themes || []).map((t) => t.name).join(", ");
  return {
    title,
    org: null,
    type: "hackathon",
    link: set.external_apply_url || `https://${s.slug}.devfolio.co/`,
    deadline: istDate(set.reg_ends_at),
    eventStart: istDate(s.starts_at),
    eventEnd: istDate(s.ends_at),
    mode: s.is_online ? "online" : "offline",
    reward: null,
    eligibleYears: [],
    eligibleBranches: [],
    minCgpa: null,
    skills: extractSkills(`${title}. ${s.tagline || ""}. ${themes}`),
    description: `${clean(s.tagline, 160) ? clean(s.tagline, 160) + " " : ""}Listed on Devfolio${s.city ? ` · ${s.city}` : ""}. Register on the original page.`,
  };
}

// ---- fetching ----
async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, Accept: "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${new URL(url).hostname} answered ${res.status}`);
  return res.json();
}

export async function fetchUnstop() {
  const out = [];
  for (const k of UNSTOP_KINDS) {
    const j = await getJson(`https://unstop.com/api/public/opportunity/search-result?opportunity=${k.kind}&page=1&per_page=${k.limit}&oppstatus=open`);
    for (const x of j?.data?.data || []) {
      const m = mapUnstop(x, k.type);
      if (m) out.push(m);
    }
  }
  return out;
}

export async function fetchDevfolio() {
  const j = await getJson("https://api.devfolio.co/api/search/hackathons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "application_open", from: 0, size: DEVFOLIO_LIMIT }),
  });
  return (j?.hits?.hits || []).map((h) => mapDevfolio(h._source || {})).filter(Boolean);
}

async function loadSnapshot(source) {
  try {
    const { default: snap } = await import("./sync-snapshot.js");
    return snap[source] || [];
  } catch {
    return [];
  }
}

// ---- saving ----
// Upsert: new listings are inserted; a listing we synced before gets its dates refreshed.
// If a student already imported the same link, their listing is kept as it is.
async function upsert(q, f, source) {
  const scam = checkScam(`${f.title}\n${f.description}`, f.link ? [f.link] : []);
  const rows = await q(
    `INSERT INTO opportunities
       (title, org, type, description, link, deadline, event_start, event_end, mode, reward,
        eligible_years, eligible_branches, min_cgpa, skills, source, status, scam_level, scam_flags, confidence, review_reasons, dedup_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'[]'::jsonb,'[]'::jsonb,NULL,$11::jsonb,$12,$13,$14,$15::jsonb,'{}'::jsonb,$16::jsonb,$17)
     ON CONFLICT (dedup_key) DO UPDATE SET deadline = EXCLUDED.deadline, event_start = EXCLUDED.event_start,
       event_end = EXCLUDED.event_end, reward = EXCLUDED.reward, mode = EXCLUDED.mode
     WHERE opportunities.source IN ('unstop','devfolio')
     RETURNING (xmax = 0) AS inserted`,
    [f.title, f.org, f.type, f.description, f.link, f.deadline, f.eventStart, f.eventEnd, f.mode, f.reward,
     JSON.stringify(f.skills || []), source, scam.level === "high" ? "pending" : "published", scam.level,
     JSON.stringify(scam.flags), JSON.stringify(scam.level === "high" ? ["Scam check: high risk"] : []),
     dedupKey({ link: f.link, title: f.title, org: f.org, deadline: f.deadline })]
  );
  if (!rows.length) return "kept"; // same link was already imported by a student
  return rows[0].inserted ? "added" : "updated";
}

// q(text, params) -> rows. Returns one summary per source.
export async function runSync(q, { sources = SYNC_SOURCES } = {}) {
  const t = today();
  const results = [];
  for (const source of sources) {
    let items = [], mode = "live", error = null;
    try {
      items = source === "unstop" ? await fetchUnstop() : await fetchDevfolio();
    } catch (e) {
      error = String(e?.message || e).slice(0, 200);
      items = await loadSnapshot(source);
      mode = "snapshot";
    }
    const open = items.filter((f) => f.deadline && f.deadline >= t);
    const counts = { added: 0, updated: 0, kept: 0 };
    for (const f of open) counts[await upsert(q, f, source)]++;
    await q(
      `INSERT INTO sync_runs (source, mode, fetched, added, updated, error) VALUES ($1,$2,$3,$4,$5,$6)`,
      [source, mode, open.length, counts.added, counts.updated, error]
    );
    results.push({ source, mode, fetched: open.length, ...counts, error });
  }
  return results;
}

export async function lastRuns(q) {
  return q(
    `SELECT DISTINCT ON (source) source, mode, fetched, added, updated, error, ran_at
     FROM sync_runs ORDER BY source, ran_at DESC`
  );
}
