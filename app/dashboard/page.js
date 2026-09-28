import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { OPP_COLS, getCalendar, withVerdicts } from "@/lib/opportunities";
import { formatShort } from "@/lib/dates";
import VerdictBadge from "@/components/VerdictBadge";
import StatusSelect from "@/components/StatusSelect";

export const dynamic = "force-dynamic";

const COLUMNS = [
  ["interested", "Interested"],
  ["applied", "Applied"],
  ["shortlisted", "Shortlisted"],
  ["completed", "Completed"],
];

export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect("/login");
  const rows = await query(
    `SELECT ${OPP_COLS}, b.status AS my_status, b.note AS my_note
     FROM bookmarks b JOIN opportunities o ON o.id = b.opp_id
     WHERE b.user_id = $1 AND o.status IN ('published','archived')
     ORDER BY o.deadline ASC NULLS LAST`,
    [user.id]
  );
  const items = withVerdicts(rows, user, await getCalendar());
  const upcoming = items.filter((o) => o.my_status === "interested" && o.verdict.daysLeft != null && o.verdict.daysLeft >= 0);
  const groups = [
    ["Closing in 3 days", upcoming.filter((o) => o.verdict.daysLeft <= 3), "text-skip"],
    ["This week", upcoming.filter((o) => o.verdict.daysLeft > 3 && o.verdict.daysLeft <= 7), "text-tight"],
    ["Later", upcoming.filter((o) => o.verdict.daysLeft > 7), "text-slate-600"],
  ];
  const clashes = items.filter((o) => o.my_status !== "completed" && o.verdict.clashes.length);

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker">My pipeline</p>
        <h1 className="text-3xl font-extrabold">Stay on top of every deadline</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLUMNS.map(([k, label]) => (
            <div key={k} className="card p-4">
              <p className="text-3xl font-extrabold text-brand">{items.filter((o) => o.my_status === k).length}</p>
              <p className="text-sm text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-lg font-semibold">Your pipeline is empty</p>
          <p className="mt-1 text-sm text-slate-500">Save opportunities from the feed and they'll show up here with their deadlines.</p>
          <Link href="/feed" className="btn-primary mt-4">Browse the feed</Link>
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h2 className="text-lg font-bold">Upcoming deadlines (not applied yet)</h2>
              {upcoming.length === 0 && <p className="mt-2 text-sm text-slate-500">Nothing pending. Nice work!</p>}
              {groups.map(([label, list, cls]) => list.length > 0 && (
                <div key={label} className="mt-4">
                  <p className={`text-xs font-bold uppercase tracking-wide ${cls}`}>{label}</p>
                  <ul className="mt-2 divide-y divide-slate-100">
                    {list.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                        <Link href={`/opportunities/${o.id}`} className="font-medium hover:text-brand">{o.title}</Link>
                        <span className="whitespace-nowrap text-sm text-slate-500">{formatShort(o.deadline)} · {o.verdict.daysLeft === 0 ? "today" : `${o.verdict.daysLeft}d`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h2 className="text-lg font-bold">Exam clashes</h2>
              {clashes.length === 0 ? <p className="mt-2 text-sm text-slate-500">None of your saved opportunities clash with exams.</p> : (
                <ul className="mt-3 space-y-3">
                  {clashes.map((o) => (
                    <li key={o.id} className="rounded-xl bg-tight-bg p-3 text-sm">
                      <Link href={`/opportunities/${o.id}`} className="font-semibold text-tight hover:underline">{o.title}</Link>
                      <p className="text-slate-700">{o.verdict.clashes.map((c) => `${c.what === "event" ? "Event" : "Deadline"} during ${c.title}`).join(", ")}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/calendar" className="btn-secondary mt-4 w-full">Open calendar</Link>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Application board</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map(([k, label]) => (
                <div key={k} className="rounded-2xl bg-slate-100 p-3">
                  <p className="mb-3 px-1 text-sm font-bold">{label}</p>
                  <div className="space-y-3">
                    {items.filter((o) => o.my_status === k).map((o) => (
                      <div key={o.id} className="card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/opportunities/${o.id}`} className="text-sm font-semibold leading-snug hover:text-brand">{o.title}</Link>
                          {k !== "completed" && <VerdictBadge verdict={o.verdict.verdict} />}
                        </div>
                        {o.deadline && <p className="mt-1 text-xs text-slate-500">Deadline {formatShort(o.deadline)}</p>}
                        {o.my_note && <p className="mt-1 text-xs italic text-slate-500">“{o.my_note}”</p>}
                        <StatusSelect id={o.id} status={k} />
                      </div>
                    ))}
                    {items.filter((o) => o.my_status === k).length === 0 && <p className="px-1 text-xs text-slate-500">Nothing here yet</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
