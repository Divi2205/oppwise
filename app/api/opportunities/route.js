import { handler, json, readJson } from "@/lib/api";
import { requireUser, requireAdmin } from "@/lib/auth";
import { listOpportunities, getCalendar, withVerdicts, saveOpportunity } from "@/lib/opportunities";
import { opportunitySchema, TYPES } from "@/lib/validation";
import { checkScam } from "@/lib/scam";

export const dynamic = "force-dynamic";

// GET /api/opportunities?q=&type=&skill=&within=&source=&eligible=1&verdict=go
export const GET = handler(async (req) => {
  const user = await requireUser();
  const sp = new URL(req.url).searchParams;
  const type = TYPES.includes(sp.get("type")) ? sp.get("type") : "";
  const within = ["3", "7", "14", "30"].includes(sp.get("within")) ? sp.get("within") : "";
  const q = (sp.get("q") || "").slice(0, 80);
  const skill = (sp.get("skill") || "").slice(0, 30);
  const source = ["unstop", "devfolio", "campus"].includes(sp.get("source")) ? sp.get("source") : "";
  const [rows, calendar] = await Promise.all([listOpportunities({ userId: user.id, q, type, skill, within, source }), getCalendar()]);
  let items = withVerdicts(rows, user, calendar);
  if (sp.get("eligible") === "1") items = items.filter((o) => o.verdict.eligibility.eligible);
  if (["go", "tight", "skip"].includes(sp.get("verdict"))) items = items.filter((o) => o.verdict.verdict === sp.get("verdict"));
  return json({ items });
});

// POST /api/opportunities  (admin posts directly)
export const POST = handler(async (req) => {
  const admin = await requireAdmin();
  const f = opportunitySchema.parse(await readJson(req));
  const scam = checkScam(`${f.title}\n${f.description}`, f.link ? [f.link] : []);
  const saved = await saveOpportunity(f, { source: "admin", status: scam.level === "high" ? "pending" : "published", scam, confidence: {}, reasons: scam.level === "high" ? ["Scam check: high risk"] : [], submittedBy: admin.id });
  return json(saved, saved.merged ? 200 : 201);
});
