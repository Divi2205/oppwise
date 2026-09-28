"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatShort } from "@/lib/dates";

export default function ReviewQueue({ items }) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const toggle = (id) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };
  const allOn = items.length > 0 && selected.size === items.length;

  async function act(ids, action) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, action }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error || "Couldn't update");
    setMsg(`${d.updated} item${d.updated === 1 ? "" : "s"} ${action === "approve" ? "published" : "rejected"}`);
    setSelected(new Set());
    router.refresh();
  }

  if (!items.length) return <p className="rounded-xl bg-go-bg p-4 text-sm font-medium text-go">Queue is empty — everything else was handled automatically.</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-brand" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(items.map((i) => i.id)))} /> Select all
        </label>
        <button className="btn-primary py-1.5" disabled={busy || !selected.size} onClick={() => act([...selected], "approve")}>Approve selected</button>
        <button className="btn-danger py-1.5" disabled={busy || !selected.size} onClick={() => act([...selected], "reject")}>Reject selected</button>
        {msg && <span role="status" className="text-sm text-slate-600">{msg}</span>}
      </div>
      <ul className="space-y-3">
        {items.map((o) => {
          const lowFields = Object.entries(o.confidence || {}).filter(([, v]) => v !== "high").map(([k]) => k);
          return (
            <li key={o.id} className={`rounded-xl border p-4 ${o.scam_level === "high" ? "border-skip/40 bg-skip-bg/50" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-wrap items-start gap-3">
                <input type="checkbox" aria-label={`Select ${o.title}`} className="mt-1 h-4 w-4 accent-brand" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                <div className="min-w-0 flex-1">
                  <Link href={`/opportunities/${o.id}`} className="font-semibold hover:text-brand">{o.title}</Link>
                  <p className="text-xs text-slate-500">
                    <span className="capitalize">{o.type}</span> · via {o.source}{o.submitted_by_name ? ` by ${o.submitted_by_name}` : ""}{o.deadline ? ` · deadline ${formatShort(o.deadline)}` : ""}{o.dup_count > 1 ? ` · shared by ${o.dup_count}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(o.review_reasons || []).map((r) => <span key={r} className="chip bg-tight-bg text-tight">{r}</span>)}
                    {(o.scam_flags || []).map((f) => <span key={f.id} className="chip bg-skip-bg text-skip">⚠ {f.reason}</span>)}
                    {lowFields.length > 0 && <span className="chip bg-slate-100 text-slate-600">Check: {lowFields.join(", ")}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/opportunities/${o.id}/edit`} className="btn-ghost py-1.5">Edit</Link>
                  <button className="btn-secondary py-1.5 text-go" disabled={busy} onClick={() => act([o.id], "approve")}>Approve</button>
                  <button className="btn-secondary py-1.5 text-skip" disabled={busy} onClick={() => act([o.id], "reject")}>Reject</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
