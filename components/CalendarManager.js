"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { calendarSchema, fieldErrors } from "@/lib/validation";
import { formatShort } from "@/lib/dates";

export default function CalendarManager({ events }) {
  const router = useRouter();
  const [f, setF] = useState({ title: "", kind: "exam", startDate: "", endDate: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    const check = calendarSchema.safeParse(f);
    if (!check.success) return setErrors(fieldErrors(check.error));
    setErrors({}); setBusy(true);
    const res = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(check.data) });
    setBusy(false);
    if (!res.ok) return setErrors({ _: "Couldn't add the period" });
    setF({ title: "", kind: "exam", startDate: "", endDate: "" });
    router.refresh();
  }
  async function remove(id) {
    if (!confirm("Remove this period?")) return;
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-slate-100">
        {events.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span><span className={`chip mr-2 ${e.kind === "exam" ? "bg-skip-bg text-skip" : "bg-go-bg text-go"}`}>{e.kind}</span>{e.title}</span>
            <span className="flex items-center gap-3 text-slate-500">{formatShort(e.start_date)} – {formatShort(e.end_date)}
              <button onClick={() => remove(e.id)} className="text-skip hover:underline">Remove</button></span>
          </li>
        ))}
        {events.length === 0 && <li className="py-2 text-sm text-slate-500">No periods yet.</li>}
      </ul>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-5" noValidate>
        <input className="input sm:col-span-2" placeholder="e.g. Cycle Test 2" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-label="Title" />
        <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} aria-label="Kind">
          <option value="exam">Exam</option><option value="holiday">Holiday</option>
        </select>
        <input type="date" className="input" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} aria-label="Start date" />
        <input type="date" className="input" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} aria-label="End date" />
        <button className="btn-primary sm:col-span-5" disabled={busy}>Add period</button>
        {Object.values(errors)[0] && <p className="field-error sm:col-span-5">{Object.values(errors)[0]}</p>}
      </form>
    </div>
  );
}
