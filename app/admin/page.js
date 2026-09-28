import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { listOpportunities, getCalendar } from "@/lib/opportunities";
import ReviewQueue from "@/components/ReviewQueue";
import CalendarManager from "@/components/CalendarManager";
import ResetDemoButton from "@/components/ResetDemoButton";
import SyncPanel from "@/components/SyncPanel";
import { lastRuns } from "@/lib/sync";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/feed");
  const [queue, calendar, stats, top, runs] = await Promise.all([
    listOpportunities({ status: "pending", includePast: true }),
    getCalendar(),
    query(`SELECT
        (SELECT count(*)::int FROM opportunities WHERE status='published') AS published,
        (SELECT count(*)::int FROM opportunities WHERE status='pending') AS pending,
        (SELECT count(*)::int FROM opportunities WHERE status='published' AND source <> 'admin') AS auto_published,
        (SELECT count(*)::int FROM users WHERE role='student') AS students,
        (SELECT count(*)::int FROM bookmarks) AS bookmarks,
        (SELECT count(*)::int FROM bookmarks WHERE status IN ('applied','shortlisted','completed')) AS applied`),
    query(`SELECT o.id, o.title, count(b.*)::int AS saves FROM opportunities o JOIN bookmarks b ON b.opp_id=o.id
           WHERE o.status='published' GROUP BY o.id ORDER BY saves DESC, o.id LIMIT 5`),
    lastRuns(query),
  ]);
  const s = stats[0];
  const cards = [["Live listings", s.published], ["In review queue", s.pending], ["Students", s.students], ["Saves", s.bookmarks], ["Applications tracked", s.applied]];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Admin</p>
          <h1 className="text-3xl font-extrabold">Built to run with one moderator</h1>
          <p className="mt-1 text-slate-600">Trusted sources and confident imports publish automatically. Only uncertain or risky items land here.</p>
        </div>
        <div className="flex flex-wrap gap-2"><ResetDemoButton /><Link href="/admin/new" className="btn-primary">+ Post an opportunity</Link></div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-3xl font-extrabold text-brand">{v}</p><p className="text-sm text-slate-600">{k}</p></div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="text-lg font-bold">Automatic sync: Unstop &amp; Devfolio</h2>
        <p className="mb-4 text-sm text-slate-500">Open hackathons, internships and competitions are pulled in automatically, checked, merged with duplicates and published.</p>
        <SyncPanel runs={runs} />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-bold">Review queue</h2>
        <ReviewQueue items={queue} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-lg font-bold">Academic calendar</h2>
          <p className="mb-4 text-sm text-slate-500">Exam periods power clash warnings and prep plans for every student.</p>
          <CalendarManager events={calendar} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Most saved right now</h2>
          <ol className="space-y-2 text-sm">
            {top.map((o, i) => (
              <li key={o.id} className="flex justify-between gap-2"><Link href={`/opportunities/${o.id}`} className="hover:text-brand">{i + 1}. {o.title}</Link><span className="text-slate-500">{o.saves} saves</span></li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
