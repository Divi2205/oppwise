"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PIPELINE } from "@/lib/validation";

export default function StatusSelect({ id, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  async function change(e) {
    const next = e.target.value;
    setValue(next); setBusy(true);
    const res = await fetch(`/api/opportunities/${id}/bookmark`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    if (!res.ok) { setValue(status); alert("Couldn't update the status. Please try again."); return; }
    router.refresh();
  }
  return (
    <select aria-label="Move to" className="input mt-3 py-1.5 text-xs" value={value} onChange={change} disabled={busy}>
      {PIPELINE.map((s) => <option key={s} value={s}>Move to: {s[0].toUpperCase() + s.slice(1)}</option>)}
    </select>
  );
}
