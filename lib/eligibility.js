// Eligibility + skill match for one student and one opportunity.
import { skillName } from "./skills.js";

export function checkEligibility(user, opp) {
  const reasons = [];
  let eligible = true;
  const years = opp.eligible_years || [];
  const branches = opp.eligible_branches || [];

  if (years.length && user.year && !years.includes(user.year)) {
    eligible = false;
    reasons.push(`Open to year ${years.join(", ")} only (you're in year ${user.year})`);
  }
  if (branches.length && user.branch && !branches.includes(user.branch)) {
    eligible = false;
    reasons.push(`Open to ${branches.join(", ")} only`);
  }
  if (opp.min_cgpa != null && user.cgpa != null && Number(user.cgpa) < Number(opp.min_cgpa)) {
    eligible = false;
    reasons.push(`Needs CGPA ${opp.min_cgpa}+ (you have ${user.cgpa})`);
  }

  const required = opp.skills || [];
  const mine = new Set(user.skills || []);
  const have = required.filter((s) => mine.has(s));
  const missing = required.filter((s) => !mine.has(s));
  const matchPct = required.length ? Math.round((have.length / required.length) * 100) : 100;

  return { eligible, reasons, matchPct, have, missing, missingNames: missing.map(skillName) };
}
