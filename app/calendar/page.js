import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { OPP_COLS, getCalendar, withVerdicts } from "@/lib/opportunities";
import { today, toISODate, rangesOverlap, formatShort } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const showAll = searchParams.all === "1";
  const t = today();
  const m = /^\d{4}-\d{2}$/.test(searchParams.m || "") ? searchParams.m : t.slice(0, 7);
  const [y, mo] = m.split("-").map(Number);
  const first = new Date(y, mo - 1, 1);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first grid
  const prev = toISODate(new Date(y, mo - 2, 1)).slice(0, 7);
  const next = toISODate(new Date(y, mo, 1)).slice(0, 7);
  const monthName = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const calendar = await getCalendar();
  const rows = await query(
    showAll
      ? `SELECT ${OPP_COLS}, b.status AS my_status FROM opportunities o LEFT JOIN bookmarks b ON b.opp_id=o.id AND b.user_id=$1 WHERE o.status='published'`
      : `SELECT ${OPP_COLS}, b.status AS my_status FROM bookmarks b JOIN opportunities o ON o.id=b.opp_id WHERE b.user_id=$1 AND o.status='published' AND b.status <> 'completed'`,
    [user.id]
  );
  const opps = withVerdicts(rows, user, calendar);

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${m}-${String(d).padStart(2, "0")}`;
    const period = calendar.find((c) => rangesOverlap(iso, iso, c.start_date, c.end_date));
    const marks = [];
    for (const o of opps) {
      const clash = o.verdict.clashes.length > 0;
      if (o.deadline === iso) marks.push({ o, kind: "deadline", clash });
      else if (o.event_start && rangesOverlap(iso, iso, o.event_start, o.event_end || o.event_start)) marks.push({ o, kind: "event", clash });
    }
    cells.push({ d, iso, period, marks });
  }
  const monthItems = opps.filter((o) => (o.deadline || "").startsWith(m) || (o.event_start || "").startsWith(m)).sort((a, b) => (a.deadline || a.event_start).localeCompare(b.deadline || b.event_start));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Campus-aware calendar</p>
          <h1 className="text-3xl font-extrabold">{monthName}</h1>
          <p className="mt-1 text-slate-600">Exam periods are shaded, so clashes are visible at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href={`/calendar?m=${prev}${showAll ? "&all=1" : ""}`}>← Prev</Link>
          <Link className="btn-secondary" href={`/calendar${showAll ? "?all=1" : ""}`}>Today</Link>
          <Link className="btn-secondary" href={`/calendar?m=${next}${showAll ? "&all=1" : ""}`}>Next →</Link>
          <Link className="btn-ghost" href={`/calendar?m=${m}${showAll ? "" : "&all=1"}`}>{showAll ? "Show only my saved" : "Show all opportunities"}</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-skip-bg ring-1 ring-skip/30" /> Exam period</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-go-bg ring-1 ring-go/30" /> Holiday</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Deadline</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Event day</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-tight" /> Clashes with exams</span>
      </div>

      <div className="card overflow-x-auto p-3">
        <div className="grid min-w-[640px] grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-1 text-center text-xs font-semibold text-slate-500">{d}</div>)}
          {cells.map((c, i) => c === null ? <div key={i} /> : (
            <div key={i} className={`min-h-24 rounded-lg border p-1.5 ${c.period?.kind === "exam" ? "border-skip/20 bg-skip-bg" : c.period?.kind === "holiday" ? "border-go/20 bg-go-bg" : "border-slate-100 bg-white"} ${c.iso === t ? "ring-2 ring-brand" : ""}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${c.iso === t ? "text-brand" : "text-slate-700"}`}>{c.d}</span>
                {c.period && <span className={`truncate text-[10px] font-semibold ${c.period.kind === "exam" ? "text-skip" : "text-go"}`}>{c.period.title}</span>}
              </div>
              <ul className="mt-1 space-y-0.5">
                {c.marks.slice(0, 3).map(({ o, kind, clash }) => (
                  <li key={o.id + kind}>
                    <Link href={`/opportunities/${o.id}`} title={o.title} className={`block truncate rounded px-1 text-[11px] font-medium text-white ${clash ? "bg-tight" : kind === "deadline" ? "bg-brand" : "bg-teal-500"}`}>
                      {kind === "deadline" ? "⏰ " : ""}{o.title}
                    </Link>
                  </li>
                ))}
                {c.marks.length > 3 && <li className="text-[10px] text-slate-500">+{c.marks.length - 3} more</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <section className="card p-5">
        <h2 className="font-bold">This month</h2>
        {monthItems.length === 0 ? <p className="mt-2 text-sm text-slate-500">No {showAll ? "" : "saved "}opportunities this month.</p> : (
          <ul className="mt-3 divide-y divide-slate-100">
            {monthItems.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <Link href={`/opportunities/${o.id}`} className="font-medium hover:text-brand">{o.title}</Link>
                <span className="text-slate-500">
                  {o.deadline && `Deadline ${formatShort(o.deadline)}`}{o.event_start && ` · Event ${formatShort(o.event_start)}`}
                  {o.verdict.clashes.length > 0 && <span className="ml-2 chip bg-tight-bg text-tight">clashes with {o.verdict.clashes[0].title}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
