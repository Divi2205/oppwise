"use client";
import { useState } from "react";
import { PIPELINE } from "@/lib/validation";
import { BookmarkIcon, CalendarIcon, LinkIcon, FlagIcon } from "./Icons";

export default function OppActions({ id, link, initialStatus, initialNote, published }) {
  const [status, setStatus] = useState(initialStatus || null);
  const [note, setNote] = useState(initialNote || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");

  async function call(url, method, body) {
    setBusy(true); setMsg("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.fields ? Object.values(data.fields)[0] : data.error);
      return data;
    } catch (e) {
      setMsg(e.message || "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save(nextStatus) {
    const d = await call(`/api/opportunities/${id}/bookmark`, "PUT", { status: nextStatus });
    if (d) { setStatus(d.bookmark.status); setMsg("Saved to your pipeline"); }
  }
  async function remove() {
    if (await call(`/api/opportunities/${id}/bookmark`, "DELETE")) { setStatus(null); setMsg("Removed from your pipeline"); }
  }
  async function saveNote() {
    if (await call(`/api/opportunities/${id}/bookmark`, "PUT", { note })) setMsg("Note saved");
  }
  async function report(e) {
    e.preventDefault();
    const d = await call(`/api/opportunities/${id}/report`, "POST", { reason });
    if (d) { setReporting(false); setMsg(d.alreadyReported ? "You've already reported this" : d.hidden ? "Thanks — it's now hidden until an admin reviews it" : "Thanks — the admin will take a look"); }
  }

  return (
    <div className="space-y-3">
      {published && (
        <a href={`/apply/${id}`} className="btn-primary w-full"><LinkIcon size={16} /> Register / Apply</a>
      )}
      {!status ? (
        <button onClick={() => save("interested")} disabled={busy || !published} className="btn-secondary w-full"><BookmarkIcon size={16} /> Save to my pipeline</button>
      ) : (
        <div className="rounded-xl bg-brand-light p-3">
          <label htmlFor="status" className="label text-brand">Application status</label>
          <select id="status" className="input" value={status} onChange={(e) => save(e.target.value)} disabled={busy}>
            {PIPELINE.map((s) => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          <label htmlFor="note" className="label mt-3">My notes</label>
          <textarea id="note" rows={2} className="input" maxLength={500} placeholder="e.g. Online test on the 12th" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button onClick={saveNote} disabled={busy} className="btn-secondary flex-1 py-1.5">Save note</button>
            <button onClick={remove} disabled={busy} className="btn-ghost py-1.5 text-skip">Remove</button>
          </div>
        </div>
      )}
      {published && <a href={`/api/opportunities/${id}/ics`} className="btn-secondary w-full"><CalendarIcon size={16} /> Add to calendar (.ics)</a>}
      {published && !reporting && (
        <button onClick={() => setReporting(true)} className="btn-ghost w-full text-sm"><FlagIcon size={15} /> Report a problem</button>
      )}
      {reporting && (
        <form onSubmit={report} className="rounded-xl border border-slate-200 p-3">
          <label htmlFor="reason" className="label">What's wrong?</label>
          <input id="reason" className="input" maxLength={200} placeholder="e.g. Asks for money, link is dead" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button className="btn-danger flex-1 py-1.5" disabled={busy}>Send report</button>
            <button type="button" onClick={() => setReporting(false)} className="btn-ghost py-1.5">Cancel</button>
          </div>
        </form>
      )}
      {msg && <p role="status" className="text-center text-sm font-medium text-slate-600">{msg}</p>}
    </div>
  );
}
