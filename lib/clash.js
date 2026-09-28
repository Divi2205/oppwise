// Exam-clash detection: compares an opportunity's dates with the academic calendar.
import { rangesOverlap } from "./dates.js";

export function findClashes(opp, calendar) {
  const exams = calendar.filter((e) => e.kind === "exam");
  const clashes = [];
  for (const e of exams) {
    if (opp.event_start && rangesOverlap(opp.event_start, opp.event_end || opp.event_start, e.start_date, e.end_date)) {
      clashes.push({ what: "event", title: e.title, start: e.start_date, end: e.end_date });
    } else if (opp.deadline && rangesOverlap(opp.deadline, opp.deadline, e.start_date, e.end_date)) {
      clashes.push({ what: "deadline", title: e.title, start: e.start_date, end: e.end_date });
    }
  }
  return clashes;
}
