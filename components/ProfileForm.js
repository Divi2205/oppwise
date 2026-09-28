"use client";
import { useState } from "react";
import { profileSchema, fieldErrors, BRANCHES } from "@/lib/validation";
import { SKILLS } from "@/lib/skills";

export default function ProfileForm({ user }) {
  const [f, setF] = useState({ name: user.name, year: String(user.year || 1), branch: user.branch || "CSE", cgpa: user.cgpa ?? "", skills: user.skills || [] });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (id) => setF({ ...f, skills: f.skills.includes(id) ? f.skills.filter((s) => s !== id) : [...f.skills, id] });

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const check = profileSchema.safeParse(f);
    if (!check.success) return setErrors(fieldErrors(check.error));
    setErrors({}); setBusy(true);
    const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(check.data) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErrors(d.fields || {}); return setMsg(d.error || "Couldn't save"); }
    setMsg("Saved. Your verdicts now use this profile.");
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label className="label">College email</label>
          <input className="input bg-slate-50" value={user.email} disabled />
        </div>
        <div>
          <label className="label" htmlFor="year">Year</label>
          <select id="year" className="input" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}>
            {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="branch">Branch</label>
          <select id="branch" className="input" value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })}>
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cgpa">CGPA (optional)</label>
          <input id="cgpa" type="number" step="0.01" min="0" max="10" className="input" value={f.cgpa} onChange={(e) => setF({ ...f, cgpa: e.target.value })} />
          {errors.cgpa && <p className="field-error">Enter a CGPA between 0 and 10</p>}
        </div>
      </div>
      <div>
        <p className="label">Skills you're confident in</p>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => {
            const on = f.skills.includes(s.id);
            return (
              <button type="button" key={s.id} onClick={() => toggle(s.id)} aria-pressed={on}
                className={`chip border ${on ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand"}`}>{s.name}</button>
            );
          })}
        </div>
      </div>
      {msg && <p role="status" className="text-sm font-medium text-slate-700">{msg}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
