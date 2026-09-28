// All dates in the app are plain calendar dates in "YYYY-MM-DD" form.
// Keeping them as strings avoids timezone drift between server, database and browser.

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today() {
  return toISODate(new Date());
}

export function parseISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a, b) {
  // whole days from a to b (b - a)
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd; // string comparison works for YYYY-MM-DD
}

export function formatDate(s) {
  if (!s) return "";
  return parseISO(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatShort(s) {
  if (!s) return "";
  return parseISO(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
