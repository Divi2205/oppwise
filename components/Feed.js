"use client";
import { useEffect, useState } from "react";
import OppCard from "./OppCard";
import { TYPES } from "@/lib/validation";
import { SKILLS } from "@/lib/skills";

export default function Feed() {
  const [f, setF] = useState({ q: "", type: "", skill: "", within: "", source: "", eligible: "", verdict: "" });
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target.checked ? "1" : "") : e.target.value });

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setError("");
        const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
        const res = await fetch(`/api/opportunities?${qs}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setItems(data.items);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Couldn't load opportunities");
      }
    }, 250); // debounce typing
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [f]);

  const counts = items ? { go: items.filter((i) => i.verdict.verdict === "go").length, tight: items.filter((i) => i.verdict.verdict === "tight").length } : null;

  return (
    <div>
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input className="input lg:col-span-2" placeholder="Search title, organiser, keywords…" value={f.q} onChange={set("q")} aria-label="Search" />
        <select className="input" value={f.type} onChange={set("type")} aria-label="Type">
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <select className="input" value={f.skill} onChange={set("skill")} aria-label="Skill">
          <option value="">Any skill</option>
          {SKILLS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={f.within} onChange={set("within")} aria-label="Deadline">
          <option value="">Any deadline</option>
          <option value="3">Closing in 3 days</option>
          <option value="7">Within a week</option>
          <option value="14">Within 2 weeks</option>
          <option value="30">Within a month</option>
        </select>
        <select className="input" value={f.verdict} onChange={set("verdict")} aria-label="Verdict">
          <option value="">Any verdict</option>
          <option value="go">Go for it</option>
          <option value="tight">Tight</option>
          <option value="skip">Skip</option>
        </select>
        <select className="input lg:col-span-2" value={f.source} onChange={set("source")} aria-label="Source">
          <option value="">All sources</option>
          <option value="campus">Campus &amp; shared by students</option>
          <option value="unstop">Live from Unstop</option>
          <option value="devfolio">Live from Devfolio</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-4">
          <input type="checkbox" className="h-4 w-4 accent-brand" checked={f.eligible === "1"} onChange={set("eligible")} />
          Only show opportunities I'm eligible for
        </label>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl bg-skip-bg p-4 text-sm text-skip">{error}</p>}
      {!items && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-48 animate-pulse bg-slate-100" />)}
        </div>
      )}
      {items && (
        <>
          <p className="mt-6 text-sm text-slate-600">
            {items.length} opportunit{items.length === 1 ? "y" : "ies"} · <span className="font-semibold text-go">{counts.go} go for it</span> · <span className="font-semibold text-tight">{counts.tight} tight</span>
          </p>
          {items.length === 0 ? (
            <div className="card mt-4 p-10 text-center">
              <p className="text-lg font-semibold">Nothing matches these filters</p>
              <p className="mt-1 text-sm text-slate-500">Try clearing a filter, or import an opportunity you've seen.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((o) => <OppCard key={o.id} o={o} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
