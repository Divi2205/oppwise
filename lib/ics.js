// Calendar export (.ics) so deadlines land in Google Calendar / Outlook with one click.
import { addDays } from "./dates.js";

const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const d = (iso) => iso.replace(/-/g, "");

export function buildIcs(opp, baseUrl) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = [];
  if (opp.deadline) {
    events.push(["VEVENT", `UID:oppwise-${opp.id}-deadline`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d(opp.deadline)}`,
      `DTEND;VALUE=DATE:${d(addDays(opp.deadline, 1))}`, `SUMMARY:${esc("Deadline: " + opp.title)}`,
      `DESCRIPTION:${esc((opp.link ? "Apply: " + opp.link + "\n" : "") + baseUrl + "/opportunities/" + opp.id)}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${esc("Tomorrow: " + opp.title)}`, "END:VALARM"]);
  }
  if (opp.event_start) {
    events.push(["VEVENT", `UID:oppwise-${opp.id}-event`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d(opp.event_start)}`,
      `DTEND;VALUE=DATE:${d(addDays(opp.event_end || opp.event_start, 1))}`, `SUMMARY:${esc(opp.title)}`]);
  }
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OppWise//EN", "CALSCALE:GREGORIAN"];
  for (const e of events) lines.push("BEGIN:VEVENT", ...e.slice(1), "END:VEVENT");
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
