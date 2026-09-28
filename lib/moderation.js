// Auto-moderation: designed so ONE admin can run the whole college feed.
// Most items publish automatically; only uncertain or risky ones reach the review queue.
import { isConfident, KEY_FIELDS } from "./parser.js";

export const TRUSTED_SOURCES = ["email"];               // e.g. circulars from the college inbox
export const TRUSTED_CONTRIBUTOR = { minApproved: 3, maxRejected: 0 };
export const COMMUNITY_REPORT_LIMIT = 3;                 // reports before a listing is auto-hidden

export function isTrustedContributor(user) {
  return !!user && user.approved_count >= TRUSTED_CONTRIBUTOR.minApproved && user.rejected_count <= TRUSTED_CONTRIBUTOR.maxRejected;
}

// Returns { status: 'published' | 'pending' | 'rejected', reasons: string[] }
export function decide({ fields, confidence, scam, source, submitter }) {
  const reasons = [];

  // 1. Auto-reject obvious junk.
  if (!fields.title || fields.title.length < 4) return { status: "rejected", reasons: ["No recognisable title"] };
  if (!fields.link && !fields.deadline && (fields.description || "").length < 40) {
    return { status: "rejected", reasons: ["No link, no date and almost no details"] };
  }

  // 2. Anything risky always goes to a human.
  if (scam.level === "high" || scam.level === "medium") reasons.push(`Scam check: ${scam.level} risk`);

  // 3. Uncertain parsing goes to a human.
  if (confidence && !isConfident(confidence)) {
    const weak = KEY_FIELDS.filter((k) => confidence[k] !== "high");
    reasons.push(`Unsure about: ${weak.join(", ")}`);
  }

  // 4. Source trust.
  const trusted = submitter?.role === "admin" || TRUSTED_SOURCES.includes(source) || isTrustedContributor(submitter);
  if (!trusted) reasons.push("Submitted by a new contributor");

  if (submitter?.role === "admin" && scam.level !== "high") return { status: "published", reasons: [] };
  return reasons.length ? { status: "pending", reasons } : { status: "published", reasons: [] };
}
