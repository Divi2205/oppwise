import Link from "next/link";
import VerdictBadge from "./VerdictBadge";
import { formatShort } from "@/lib/dates";
import { CalendarIcon, UsersIcon } from "./Icons";

export const TYPE_STYLE = {
  internship: "bg-sky-100 text-sky-800", hackathon: "bg-violet-100 text-violet-800", workshop: "bg-emerald-100 text-emerald-800",
  certification: "bg-amber-100 text-amber-800", competition: "bg-rose-100 text-rose-800", job: "bg-slate-200 text-slate-800", event: "bg-teal-100 text-teal-800",
};

export const SYNCED = { unstop: "Unstop", devfolio: "Devfolio" };

export default function OppCard({ o }) {
  const v = o.verdict;
  const topReason = v.bad[0] || v.warn[0] || v.good[0];
  return (
    <Link href={`/opportunities/${o.id}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={`chip capitalize ${TYPE_STYLE[o.type]}`}>{o.type}</span>
          {SYNCED[o.source] && <span className="chip bg-ink text-lime">Live · {SYNCED[o.source]}</span>}
        </span>
        <VerdictBadge verdict={v.verdict} />
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug group-hover:text-brand">{o.title}</h3>
      {o.org && <p className="text-sm text-slate-500">{o.org}</p>}
      <p className={`mt-3 text-sm ${v.verdict === "skip" ? "text-skip" : v.verdict === "tight" ? "text-tight" : "text-go"}`}>{topReason}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-slate-500">
        {o.deadline && (
          <span className="inline-flex items-center gap-1"><CalendarIcon size={14} /> Closes {formatShort(o.deadline)}{v.daysLeft != null && v.daysLeft >= 0 ? ` · ${v.daysLeft}d left` : ""}</span>
        )}
        {(o.skills || []).length > 0 && <span>{v.eligibility.matchPct}% match</span>}
        {o.bookmark_count > 0 && <span className="inline-flex items-center gap-1"><UsersIcon size={14} /> {o.bookmark_count} saved</span>}
        {o.dup_count > 1 && <span>Shared by {o.dup_count}</span>}
        {o.my_status && <span className="chip bg-brand-light capitalize text-brand">{o.my_status}</span>}
      </div>
    </Link>
  );
}
