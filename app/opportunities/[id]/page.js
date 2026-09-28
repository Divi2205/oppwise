import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getOpportunity, getCalendar, withVerdicts } from "@/lib/opportunities";
import { formatDate } from "@/lib/dates";
import { skillName } from "@/lib/skills";
import VerdictBadge from "@/components/VerdictBadge";
import OppActions from "@/components/OppActions";
import PrepPanel from "@/components/PrepPanel";
import { TYPE_STYLE, SYNCED } from "@/components/OppCard";
import { ShieldIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

function Reasons({ items, cls, symbol }) {
  return items.map((r, i) => (
    <li key={i} className={`flex gap-2 ${cls}`}><span aria-hidden className="font-bold">{symbol}</span><span>{r}</span></li>
  ));
}

export default async function OpportunityPage({ params }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const id = Number(params.id);
  const opp = Number.isInteger(id) ? await getOpportunity(id, user.id) : null;
  if (!opp || (opp.status !== "published" && user.role !== "admin" && opp.submitted_by !== user.id)) notFound();
  const [o] = withVerdicts([opp], user, await getCalendar());
  const v = o.verdict;
  const published = o.status === "published";

  const facts = [
    ["Deadline", o.deadline ? formatDate(o.deadline) + (v.daysLeft >= 0 ? ` (${v.daysLeft} days left)` : " (closed)") : "Not specified"],
    ["Event dates", o.event_start ? (o.event_end && o.event_end !== o.event_start ? `${formatDate(o.event_start)} – ${formatDate(o.event_end)}` : formatDate(o.event_start)) : "—"],
    ["Mode", o.mode ? o.mode[0].toUpperCase() + o.mode.slice(1) : "—"],
    ["Reward", o.reward || "—"],
    ["Open to", [o.eligible_years.length ? `Year ${o.eligible_years.join(", ")}` : "All years", o.eligible_branches.length ? o.eligible_branches.join(", ") : "all branches", o.min_cgpa != null ? `CGPA ${o.min_cgpa}+` : null].filter(Boolean).join(" · ")],
    ["Source", `${SYNCED[o.source] ? `Synced automatically from ${SYNCED[o.source]}` : o.source === "admin" ? "Posted by admin" : o.source === "email" ? "College email" : `Imported (${o.source})`}${o.dup_count > 1 ? ` · shared by ${o.dup_count} students` : ""}`],
  ];

  return (
    <div className="space-y-6">
      <Link href="/feed" className="text-sm font-medium text-brand hover:underline">← Back to feed</Link>
      {!published && (
        <p className="rounded-xl bg-tight-bg p-3 text-sm font-medium text-tight">
          This listing is <b>{o.status}</b> and only visible to admins{o.submitted_by === user.id ? " and you" : ""}.
          {o.review_reasons?.length ? ` Reasons: ${o.review_reasons.join("; ")}.` : ""}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <span className={`chip capitalize ${TYPE_STYLE[o.type]}`}>{o.type}</span>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{o.title}</h1>
            {o.org && <p className="mt-1 text-slate-600">{o.org}</p>}
            {SYNCED[o.source] && o.link && (
              <a href={o.link} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                View original on {SYNCED[o.source]} ↗
              </a>
            )}
            <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {facts.map(([k, val]) => (
                <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt><dd className="text-sm">{val}</dd></div>
              ))}
            </dl>
            {o.skills.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {o.skills.map((s) => {
                    const have = (user.skills || []).includes(s);
                    return <span key={s} className={`chip ${have ? "bg-go-bg text-go" : "bg-tight-bg text-tight"}`}>{have ? "✓" : "✗"} {skillName(s)}</span>;
                  })}
                </div>
              </div>
            )}
            {o.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{o.description}</p>}
          </section>

          {o.scam_flags.length > 0 && (
            <section className={`card p-5 ${o.scam_level === "high" ? "border-skip/40 bg-skip-bg" : "border-tight/40 bg-tight-bg"}`}>
              <h2 className={`flex items-center gap-2 font-bold ${o.scam_level === "high" ? "text-skip" : "text-tight"}`}><ShieldIcon /> Scam check: {o.scam_level} risk</h2>
              <ul className="mt-2 space-y-1 text-sm">{o.scam_flags.map((f) => <li key={f.id}>• {f.reason}</li>)}</ul>
            </section>
          )}

          {published && o.skills.length > 0 && v.eligibility.eligible && <PrepPanel id={o.id} matchPct={v.eligibility.matchPct} />}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <p className="kicker">Should I apply?</p>
            <div className="mt-3"><VerdictBadge verdict={v.verdict} large /></div>
            <ul className="mt-4 space-y-2 text-sm">
              <Reasons items={v.bad} cls="text-skip" symbol="✗" />
              <Reasons items={v.warn} cls="text-tight" symbol="!" />
              <Reasons items={v.good} cls="text-go" symbol="✓" />
            </ul>
          </section>
          <section className="card p-5">
            <OppActions id={o.id} link={o.link} initialStatus={o.my_status} initialNote={o.my_note} published={published} />
          </section>
          {user.role === "admin" && (
            <Link href={`/admin/opportunities/${o.id}/edit`} className="btn-secondary w-full">Edit as admin</Link>
          )}
        </aside>
      </div>
    </div>
  );
}
