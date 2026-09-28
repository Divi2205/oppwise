"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TYPES, MODES, BRANCHES } from "@/lib/validation";
import { SKILLS } from "@/lib/skills";
import { CameraIcon, ShieldIcon } from "./Icons";

const SAMPLE = `🚀 *HackVerse 2026 — 24-hour National Hackathon* 🚀
Organised by Tech Society
Open to 2nd, 3rd and final year students of CSE, IT and AIML.
Build with React, Node.js and any cloud platform. Prize pool ₹75,000 💰
Hackathon on 24-25 October, offline at the main auditorium.
Last date to register: 15 October
No registration fee!
Register here 👉 https://forms.gle/hackverse2026demo`;

const SCAM_SAMPLE = `URGENT!!! Work from home internship for ALL students 💼
Guaranteed internship certificate + LOR. Earn ₹2000 per day!
Pay ₹499 registration fee to confirm your seat. Limited seats, hurry!
Send your resume on WhatsApp or mail hr.careers.india@gmail.com`;

export default function ImportForm({ initial }) {
  const [tab, setTab] = useState("paste");
  const [text, setText] = useState(initial.text || "");
  const [url, setUrl] = useState(initial.url || "");
  const [source, setSource] = useState(initial.text || initial.url ? "share" : "paste");
  const [preview, setPreview] = useState(null);
  const [fields, setFields] = useState(null);
  const [touched, setTouched] = useState(new Set());
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [ocr, setOcr] = useState(null);
  const fileRef = useRef(null);

  async function readIt(t = text, u = url) {
    setError(""); setResult(null); setBusy("preview");
    try {
      const res = await fetch("/api/import/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t, url: u || null }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.fields ? Object.values(d.fields)[0] : d.error);
      setPreview(d); setFields(d.fields); setTouched(new Set());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  // Opened from the phone's share menu: read it straight away.
  useEffect(() => {
    if ((initial.text || "").length >= 15) readIt(initial.text, initial.url);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onPoster(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file");
    if (file.size > 8 * 1024 * 1024) return setError("Image is too large (max 8 MB)");
    setError(""); setOcr({ progress: 0, status: "Loading text recogniser…" }); setSource("poster");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m) => m.status === "recognizing text" && setOcr({ progress: Math.round(m.progress * 100), status: "Reading the poster…" }),
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const out = (data.text || "").trim();
      setOcr(null);
      if (out.length < 15) return setError("Couldn't read enough text. Try a sharper, well-lit photo taken straight on.");
      setText(out);
      setTab("paste");
      readIt(out, url);
    } catch {
      setOcr(null);
      setError("Text recognition failed. You can paste the text instead.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const setField = (k, v) => { setFields({ ...fields, [k]: v }); setTouched(new Set([...touched, k])); };
  const toggleIn = (k, v) => setField(k, fields[k].includes(v) ? fields[k].filter((x) => x !== v) : [...fields[k], v]);
  const low = (k) => preview?.confidence?.[k] && preview.confidence[k] !== "high" && !touched.has(k);

  async function submit() {
    setError(""); setBusy("submit");
    const overrides = {};
    for (const k of touched) overrides[k] = fields[k];
    try {
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, url: url || null, source, overrides }) });
      const d = await res.json();
      if (!res.ok && res.status !== 422) throw new Error(d.fields ? Object.entries(d.fields).map(([k, m]) => `${k}: ${m}`).join(" · ") : d.error);
      setResult(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  function reset() { setText(""); setUrl(""); setPreview(null); setFields(null); setResult(null); setError(""); setSource("paste"); }

  if (result) {
    const box = result.status === "published" ? "bg-go-bg text-go" : result.status === "pending" ? "bg-tight-bg text-tight" : "bg-skip-bg text-skip";
    return (
      <div className={`card p-6 ${box}`}>
        <h2 className="text-xl font-bold">
          {result.merged ? "Already listed — your share was added" : result.status === "published" ? "Published to the college feed ✓" : result.status === "pending" ? "Sent to the review queue" : "Not accepted"}
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          {result.merged
            ? "Someone had already shared this. We merged yours into the same listing, which makes it rank as more popular."
            : result.status === "published"
            ? "It passed every automatic check, so it went live immediately."
            : result.status === "pending"
            ? "An admin will take a quick look because:"
            : "The import was rejected because:"}
        </p>
        {!result.merged && result.reasons?.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
        <div className="mt-5 flex flex-wrap gap-2">
          {result.id && <Link className="btn-primary" href={`/opportunities/${result.id}`}>View listing</Link>}
          <button className="btn-secondary" onClick={reset}>Import another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="card p-5 lg:col-span-2">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist">
          {[["paste", "Paste text"], ["poster", "Snap a poster"]].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 rounded-lg py-2 ${tab === k ? "bg-white shadow-sm" : "text-slate-500"}`}>{l}</button>
          ))}
        </div>

        {tab === "paste" ? (
          <div className="mt-4 space-y-3">
            <label className="label" htmlFor="text">WhatsApp forward, email or any text</label>
            <textarea id="text" rows={10} className="input font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the message here…" maxLength={6000} />
            <label className="label" htmlFor="url">Link (optional)</label>
            <input id="url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            <button className="btn-primary w-full" onClick={() => readIt()} disabled={busy === "preview" || text.trim().length < 15}>{busy === "preview" ? "Reading…" : "Read it"}</button>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500">Try a sample:</span>
              <button className="font-semibold text-brand hover:underline" onClick={() => { setText(SAMPLE); setSource("paste"); }}>hackathon forward</button>
              <button className="font-semibold text-brand hover:underline" onClick={() => { setText(SCAM_SAMPLE); setSource("paste"); }}>suspicious forward</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-center">
            <p className="text-sm text-slate-600">Photograph a notice-board poster. The text is read on your device, then parsed like a forward.</p>
            <label className="btn-primary w-full cursor-pointer">
              <CameraIcon size={16} /> Take or choose a photo
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPoster} />
            </label>
            {ocr && (
              <div className="text-left">
                <p className="text-sm font-medium">{ocr.status}</p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand transition-all" style={{ width: `${ocr.progress}%` }} /></div>
              </div>
            )}
            <p className="text-xs text-slate-500">Tip: flat, well-lit, straight-on photos work best.</p>
          </div>
        )}
        {error && <p role="alert" className="mt-3 rounded-xl bg-skip-bg p-3 text-sm font-medium text-skip">{error}</p>}
      </section>

      <section className="lg:col-span-3">
        {!preview ? (
          <div className="card flex h-full min-h-64 flex-col items-center justify-center p-8 text-center text-slate-500">
            <p className="text-lg font-semibold text-slate-700">Your preview appears here</p>
            <p className="mt-1 text-sm">We'll pull out the title, deadline, link, eligibility and skills, and check it for scams.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {preview.duplicate && (
              <p className="rounded-xl bg-brand-light p-3 text-sm font-medium text-brand">
                Already listed as “{preview.duplicate.title}” (shared by {preview.duplicate.dup_count}). Submitting adds your share to it.
              </p>
            )}
            {preview.scam.level !== "none" && (
              <div className={`rounded-xl p-4 ${preview.scam.level === "high" ? "bg-skip-bg text-skip" : "bg-tight-bg text-tight"}`}>
                <p className="flex items-center gap-2 font-bold"><ShieldIcon /> Scam check: {preview.scam.level} risk</p>
                <ul className="mt-1 list-disc pl-6 text-sm">{preview.scam.flags.map((f) => <li key={f.id}>{f.reason}</li>)}</ul>
              </div>
            )}
            <div className="card space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">What we understood</h2>
                <span className="chip bg-tight-bg text-tight">Highlighted = please check</span>
              </div>
              <Input label="Title" value={fields.title} onChange={(v) => setField("title", v)} low={low("title")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Organiser" value={fields.org || ""} onChange={(v) => setField("org", v)} low={low("org")} />
                <div>
                  <label className="label">Type</label>
                  <select className={`input capitalize ${low("type") ? "low-conf" : ""}`} value={fields.type} onChange={(e) => setField("type", e.target.value)}>
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Input label="Deadline" type="date" value={fields.deadline || ""} onChange={(v) => setField("deadline", v || null)} low={low("deadline")} />
                <Input label="Registration link" value={fields.link || ""} onChange={(v) => setField("link", v || null)} low={low("link")} />
                <Input label="Event starts" type="date" value={fields.eventStart || ""} onChange={(v) => setField("eventStart", v || null)} />
                <Input label="Event ends" type="date" value={fields.eventEnd || ""} onChange={(v) => setField("eventEnd", v || null)} />
                <div>
                  <label className="label">Mode</label>
                  <select className="input" value={fields.mode || ""} onChange={(e) => setField("mode", e.target.value || null)}>
                    <option value="">Not specified</option>
                    {MODES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <Input label="Min CGPA" type="number" value={fields.minCgpa ?? ""} onChange={(v) => setField("minCgpa", v === "" ? null : Number(v))} />
              </div>
              <Chips label="Open to years (none = all)" options={[1, 2, 3, 4]} fmt={(y) => `Year ${y}`} selected={fields.eligibleYears} onToggle={(y) => toggleIn("eligibleYears", y)} />
              <Chips label="Branches (none = all)" options={BRANCHES} selected={fields.eligibleBranches} onToggle={(b) => toggleIn("eligibleBranches", b)} />
              <Chips label="Skills" options={SKILLS.map((s) => s.id)} fmt={(id) => SKILLS.find((s) => s.id === id).name} selected={fields.skills} onToggle={(s) => toggleIn("skills", s)} />
              {fields.reward && <p className="text-sm text-slate-600"><b>Reward:</b> {fields.reward}</p>}
              <button className="btn-primary w-full" onClick={submit} disabled={busy === "submit" || !fields.title}>{busy === "submit" ? "Submitting…" : "Submit to the college feed"}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, low, type = "text" }) {
  return (
    <div>
      <label className="label">{label}{low && <span className="ml-2 text-xs font-semibold text-tight">please check</span>}</label>
      <input type={type} className={`input ${low ? "low-conf" : ""}`} value={value} onChange={(e) => onChange(e.target.value)} step={type === "number" ? "0.1" : undefined} />
    </div>
  );
}

function Chips({ label, options, selected, onToggle, fmt = (x) => x }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button type="button" key={o} onClick={() => onToggle(o)} aria-pressed={on}
              className={`chip border ${on ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand"}`}>
              {fmt(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
