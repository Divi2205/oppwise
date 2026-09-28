import { handler, json } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { getOpportunity, getCalendar } from "@/lib/opportunities";
import { checkEligibility } from "@/lib/eligibility";
import { buildPrepPlan } from "@/lib/prep";
import { today } from "@/lib/dates";

export const GET = handler(async (_req, { params }) => {
  const user = await requireUser();
  const opp = await getOpportunity(Number(params.id), user.id);
  if (!opp || opp.status !== "published") throw new HttpError(404, "Not found");
  const elig = checkEligibility(user, opp);
  const prep = buildPrepPlan(elig.missing, opp.deadline, await getCalendar(), today());
  return json({ matchPct: elig.matchPct, missing: elig.missing, ...prep });
});
