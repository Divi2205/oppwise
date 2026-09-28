// "Prep for this": schedules missing skills into the days before the deadline,
// skipping exam days from the academic calendar.
import { addDays, daysBetween, rangesOverlap } from "./dates.js";
import { SKILL_BY_ID } from "./skills.js";

export function buildPrepPlan(missing, deadline, calendar, todayISO) {
  const topics = missing.map((id) => SKILL_BY_ID[id]).filter(Boolean).sort((a, b) => b.effortDays - a.effortDays);
  const needed = topics.reduce((n, t) => n + t.effortDays, 0);
  const exams = calendar.filter((e) => e.kind === "exam");

  // Available study days: tomorrow .. the day before the deadline, minus exam days.
  const available = [];
  const skipped = [];
  if (deadline) {
    const span = daysBetween(todayISO, deadline);
    for (let i = 1; i < span; i++) {
      const d = addDays(todayISO, i);
      const exam = exams.find((e) => rangesOverlap(d, d, e.start_date, e.end_date));
      if (exam) skipped.push({ date: d, reason: exam.title });
      else available.push(d);
    }
  }

  const plan = [];
  let cursor = 0;
  for (const t of topics) {
    const days = available.slice(cursor, cursor + t.effortDays);
    cursor += t.effortDays;
    plan.push({ id: t.id, name: t.name, effortDays: t.effortDays, days, resources: t.resources });
  }
  const feasible = !deadline || needed <= available.length;
  return { plan, needed, available: available.length, skipped, feasible };
}
