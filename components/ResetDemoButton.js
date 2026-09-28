"use client";
import { useState } from "react";

export default function ResetDemoButton() {
  const [busy, setBusy] = useState(false);
  async function reset() {
    if (!confirm("Reset all demo data? Every listing, account and bookmark goes back to the original demo state with fresh dates.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/reset", { method: "POST" });
    setBusy(false);
    if (!res.ok) return alert("Reset failed. Please try again.");
    window.location.href = "/admin";
  }
  return <button onClick={reset} disabled={busy} className="btn-secondary">{busy ? "Resetting…" : "Reset demo data"}</button>;
}
