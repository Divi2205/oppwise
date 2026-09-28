"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatShort } from "@/lib/dates";
import { BookIcon } from "./Icons";

export default function PrepPanel({ id, matchPct }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    setError("");
    const res = await fetch(`/api/opportunities/${id}/prep`);
    const d = await res.json();
    if (!res.ok) return setError(d.error || "Couldn't build a plan");
    setData(d);
  }
  useEffect(() => { if (open) load(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markReady(skill) {
    setBusy(skill);
    const res = await fetch("/api/me/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill, ready: true }) });
    setBusy("");
    if (!res.ok) return setError("Couldn't update your skills");
    await load();
    router.refresh(); // recompute the verdict on the page
  }

  const pct = data ? data.matchPct : matchPct;
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand"><BookIcon /></span>
          <div>
            <h2 className="font-bold">Prep for this</h2>
            <p className="text-sm text-slate-500">Close your skill gaps before the deadline</p>
          </div>
        </div>
        {!open && <button className="btn-primary" onClick={() => setOpen(true)}>Show my prep plan</button>}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm font-medium"><span>Skill match</span><span>{pct}%</span></div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-go" : pct >= 80 ? "bg-brand" : "bg-tight"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {open && !data && !error && <p className="mt-4 text-sm text-slate-500">Building your plan…</p>}
      {error && <p role="alert" className="mt-4 text-sm text-skip">{error}</p>}
      {data && (
        <div className="mt-5 space-y-4">
          {data.missing.length === 0 ? (
            <p className="rounded-xl bg-go-bg p-4 font-semibold text-go">You have every skill this needs. Ready to apply!</p>
          ) : (
            <>
              <p className={`rounded-xl p-3 text-sm font-medium ${data.feasible ? "bg-go-bg text-go" : "bg-tight-bg text-tight"}`}>
                {data.feasible
                  ? `About ${data.needed} prep day${data.needed === 1 ? "" : "s"} needed · ${data.available} free day${data.available === 1 ? "" : "s"} before the deadline.`
                  : `Tight: about ${data.needed} prep days needed but only ${data.available} free before the deadline. Start with ${data.plan[0]?.name}.`}
                {data.skipped.length > 0 && ` ${data.skipped.length} exam day${data.skipped.length === 1 ? "" : "s"} skipped (${data.skipped[0].reason}).`}
              </p>
              <ol className="space-y-3">
                {data.plan.map((t, i) => (
                  <li key={t.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{i + 1}. {t.name} <span className="font-normal text-slate-500">· ~{t.effortDays} day{t.effortDays === 1 ? "" : "s"}</span></p>
                      <button className="btn-secondary py-1.5 text-go" disabled={busy === t.id} onClick={() => markReady(t.id)}>{busy === t.id ? "Saving…" : "Mark as ready ✓"}</button>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{t.days.length ? `Study on ${t.days.map(formatShort).join(", ")}` : "No free days left before the deadline"}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {t.resources.map((r) => (
                        <li key={r.url}><a className="chip bg-brand-light text-brand hover:underline" href={r.url} target="_blank" rel="noopener noreferrer">{r.title} ↗</a></li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </section>
  );
}
