"use client";
import { useState } from "react";
import { opportunitySchema, fieldErrors, TYPES, MODES, BRANCHES } from "@/lib/validation";
import { SKILLS } from "@/lib/skills";

const EMPTY = { title: "", org: "", type: "internship", description: "", link: "", deadline: "", eventStart: "", eventEnd: "", mode: "", reward: "", eligibleYears: [], eligibleBranches: [], minCgpa: "", skills: [] };

export default function OppForm({ initial, id }) {
  const [f, setF] = useState({ ...EMPTY, ...(initial || {}) });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    const check = opportunitySchema.safeParse(f);
    if (!check.success) return setErrors(fieldErrors(check.error));
    setErrors({}); setBusy(true);
    const res = await fetch(id ? `/api/opportunities/${id}` : "/api/opportunities", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(check.data) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErrors(d.fields || {}); return setMsg(d.error || "Couldn't save"); }
    window.location.href = `/opportunities/${id || d.id}`;
  }

  const Err = ({ k }) => (errors[k] ? <p className="field-error">{errors[k]}</p> : null);
  return (
    <form onSubmit={submit} className="card space-y-5 p-6" noValidate>
      <div>
        <label className="label" htmlFor="title">Title *</label>
        <input id="title" className="input" value={f.title} onChange={set("title")} />
        <Err k="title" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="org">Organiser</label><input id="org" className="input" value={f.org || ""} onChange={set("org")} /></div>
        <div><label className="label" htmlFor="type">Type *</label>
          <select id="type" className="input capitalize" value={f.type} onChange={set("type")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label" htmlFor="link">Registration link</label><input id="link" className="input" value={f.link || ""} onChange={set("link")} placeholder="https://…" /><Err k="link" /></div>
        <div><label className="label" htmlFor="deadline">Deadline</label><input id="deadline" type="date" className="input" value={f.deadline || ""} onChange={set("deadline")} /><Err k="deadline" /></div>
        <div><label className="label" htmlFor="es">Event starts</label><input id="es" type="date" className="input" value={f.eventStart || ""} onChange={set("eventStart")} /></div>
        <div><label className="label" htmlFor="ee">Event ends</label><input id="ee" type="date" className="input" value={f.eventEnd || ""} onChange={set("eventEnd")} /><Err k="eventEnd" /></div>
        <div><label className="label" htmlFor="mode">Mode</label>
          <select id="mode" className="input" value={f.mode || ""} onChange={set("mode")}><option value="">Not specified</option>{MODES.map((m) => <option key={m}>{m}</option>)}</select></div>
        <div><label className="label" htmlFor="reward">Reward / stipend</label><input id="reward" className="input" value={f.reward || ""} onChange={set("reward")} /></div>
        <div><label className="label" htmlFor="cg">Minimum CGPA</label><input id="cg" type="number" step="0.1" min="0" max="10" className="input" value={f.minCgpa ?? ""} onChange={set("minCgpa")} /><Err k="minCgpa" /></div>
      </div>
      <div>
        <p className="label">Open to years (none selected = all)</p>
        <div className="flex flex-wrap gap-2">{[1, 2, 3, 4].map((y) => <Pill key={y} on={f.eligibleYears.includes(y)} onClick={() => toggle("eligibleYears", y)}>Year {y}</Pill>)}</div>
      </div>
      <div>
        <p className="label">Branches (none selected = all)</p>
        <div className="flex flex-wrap gap-2">{BRANCHES.map((b) => <Pill key={b} on={f.eligibleBranches.includes(b)} onClick={() => toggle("eligibleBranches", b)}>{b}</Pill>)}</div>
      </div>
      <div>
        <p className="label">Skills</p>
        <div className="flex flex-wrap gap-2">{SKILLS.map((s) => <Pill key={s.id} on={f.skills.includes(s.id)} onClick={() => toggle("skills", s.id)}>{s.name}</Pill>)}</div>
      </div>
      <div>
        <label className="label" htmlFor="desc">Description</label>
        <textarea id="desc" rows={5} className="input" value={f.description} onChange={set("description")} />
      </div>
      {msg && <p role="alert" className="rounded-xl bg-skip-bg p-3 text-sm font-medium text-skip">{msg}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : id ? "Save changes" : "Publish opportunity"}</button>
    </form>
  );
}

function Pill({ on, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`chip border ${on ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand"}`}>{children}</button>
  );
}
