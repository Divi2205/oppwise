"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LABEL = { unstop: "Unstop", devfolio: "Devfolio" };

function ago(ts) {
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

export default function SyncPanel({ runs }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function sync() {
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/sync", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error || "Sync failed");
    setMsg(d.results.map((r) => `${LABEL[r.source]}: ${r.added} new, ${r.updated} refreshed${r.mode === "snapshot" ? " (saved snapshot)" : ""}`).join(" · "));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {["unstop", "devfolio"].map((s) => {
          const r = runs.find((x) => x.source === s);
          return (
            <div key={s} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{LABEL[s]}</p>
                {r && <span className={`chip ${r.mode === "live" ? "bg-go-bg text-go" : "bg-tight-bg text-tight"}`}>{r.mode === "live" ? "Live" : "Snapshot"}</span>}
              </div>
              {r ? (
                <p className="mt-1 text-sm text-slate-600">
                  Last sync {ago(r.ran_at)} · {r.fetched} open listings · {r.added} new, {r.updated} refreshed
                  {r.error && <span className="block text-xs text-tight">Couldn't reach the site ({r.error}); used the saved snapshot.</span>}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Not synced yet</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={sync} disabled={busy}>{busy ? "Syncing…" : "Sync now"}</button>
        <p className="text-xs text-slate-500">Runs automatically once a day. Keeps only title, dates, mode and link, and always links back to the original page.</p>
      </div>
      {msg && <p role="status" className="text-sm font-medium text-slate-700">{msg}</p>}
    </div>
  );
}
