// Duplicate detection. The same forward pasted by ten students must become ONE listing.
// The key is stored in a UNIQUE column, so the database itself enforces it.

export function normalizeLink(link) {
  if (!link) return null;
  try {
    const u = new URL(link);
    for (const p of [...u.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|fbclid|gclid|si$)/i.test(p)) u.searchParams.delete(p);
    }
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    const qs = u.searchParams.toString();
    return `${host}${path}${qs ? "?" + qs : ""}`.toLowerCase();
  } catch {
    return String(link).toLowerCase().trim();
  }
}

export function normalizeTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|20\d\d|registrations? (are )?open|apply now)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupKey({ link, title, org, deadline }) {
  const l = normalizeLink(link);
  if (l) return `link:${l}`;
  const t = normalizeTitle(title);
  if (!t) return null;
  return `title:${t}|${normalizeTitle(org)}|${deadline || ""}`;
}
