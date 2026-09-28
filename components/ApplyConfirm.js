"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, CalendarIcon, LinkIcon } from "./Icons";

// Records the registration in the student's pipeline (moves it to "Applied").
export default function ApplyConfirm({ id, title, org, deadlineText, status, externalLink, sourceName }) {
  const alreadyAhead = ["applied", "shortlisted", "completed"].includes(status);
  const [state, setState] = useState(alreadyAhead ? "done" : "saving");

  useEffect(() => {
    if (alreadyAhead) return;
    fetch(`/api/opportunities/${id}/bookmark`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "applied" }),
    })
      .then((r) => setState(r.ok ? "done" : "error"))
      .catch(() => setState("error"));
  }, [id, alreadyAhead]);

  if (state === "saving") {
    return <div className="card mx-auto max-w-xl p-10 text-center text-slate-500" aria-busy="true">Submitting your registration…</div>;
  }
  if (state === "error") {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <p className="text-lg font-semibold text-skip">We couldn't record your registration</p>
        <p className="mt-1 text-sm text-slate-500">Please check your connection and try again.</p>
        <button className="btn-primary mt-5" onClick={() => location.reload()}>Try again</button>
      </div>
    );
  }
  return (
    <div className="card mx-auto max-w-xl overflow-hidden text-center">
      <div className="bg-go-bg px-8 py-8">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-go text-white"><CheckIcon size={34} /></span>
        <h1 className="mt-4 text-2xl font-extrabold text-go">Registration submitted</h1>
        <p className="mt-1 text-slate-700">{title}{org ? ` · ${org}` : ""}</p>
      </div>
      <div className="space-y-4 p-8">
        <p className="text-sm text-slate-600">
          {alreadyAhead ? "This is already in your pipeline." : "We've moved this to Applied in your pipeline, so you can track what happens next."}
          {deadlineText ? ` Deadline: ${deadlineText}.` : ""}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/dashboard" className="btn-primary">View my pipeline</Link>
          <a href={`/api/opportunities/${id}/ics`} className="btn-secondary"><CalendarIcon size={16} /> Add to calendar</a>
          <Link href={`/opportunities/${id}`} className="btn-ghost">Back to listing</Link>
        </div>
        {externalLink && sourceName && (
          <div className="rounded-xl bg-brand-light p-4 text-sm text-slate-700">
            <p>This listing comes from {sourceName}. Finish your registration there:</p>
            <a href={externalLink} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary mt-3">
              <LinkIcon size={16} /> Complete registration on {sourceName} ↗
            </a>
          </div>
        )}
        {externalLink && !sourceName && (
          <a href={externalLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <LinkIcon size={14} /> Also open the organiser's form ↗
          </a>
        )}
      </div>
    </div>
  );
}
