// "Should I apply?" — combines everything we know into one verdict with visible reasons.
import { daysBetween, formatShort } from "./dates.js";
import { checkEligibility } from "./eligibility.js";
import { findClashes } from "./clash.js";

export function computeVerdict(user, opp, calendar, todayISO) {
  const elig = checkEligibility(user, opp);
  const clashes = findClashes(opp, calendar);
  const daysLeft = opp.deadline ? daysBetween(todayISO, opp.deadline) : null;
  const good = [], warn = [], bad = [];

  // Hard stops
  if (opp.scam_level === "high") bad.push("Failed the scam check: " + (opp.scam_flags?.[0]?.reason || "red flags found"));
  if (!elig.eligible) bad.push(...elig.reasons);
  if (daysLeft != null && daysLeft < 0) bad.push("Deadline has passed");

  // Cautions
  if (opp.scam_level === "medium") warn.push("Some red flags: " + opp.scam_flags.map((f) => f.reason.toLowerCase()).join("; "));
  if (elig.matchPct < 80) warn.push(`${elig.matchPct}% skill match — missing ${elig.missingNames.join(", ")}`);
  for (const c of clashes) {
    warn.push(c.what === "event" ? `Event dates clash with ${c.title} (${formatShort(c.start)}–${formatShort(c.end)})` : `Deadline falls during ${c.title}`);
  }
  if (daysLeft != null && daysLeft >= 0 && daysLeft <= 3) warn.push(daysLeft === 0 ? "Closes today" : `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`);

  // Positives
  if (elig.eligible && (opp.eligible_years?.length || opp.eligible_branches?.length || opp.min_cgpa != null)) good.push("You meet the eligibility criteria");
  if (elig.matchPct >= 80 && (opp.skills || []).length) good.push(`${elig.matchPct}% skill match`);
  if (daysLeft != null && daysLeft > 3) good.push(`${daysLeft} days left`);
  if (!clashes.length) good.push("No exam clashes");
  if (opp.scam_level === "none") good.push(opp.source === "admin" || opp.source === "email" ? "Verified source" : "No scam red flags");
  if (opp.dup_count > 1) good.push(`Shared by ${opp.dup_count} students`);

  const verdict = bad.length ? "skip" : warn.length ? "tight" : "go";
  return { verdict, good, warn, bad, eligibility: elig, clashes, daysLeft };
}

export const VERDICT_LABEL = { go: "Go for it", tight: "Tight", skip: "Skip" };
