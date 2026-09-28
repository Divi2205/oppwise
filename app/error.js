"use client";
export default function Error({ reset }) {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm text-slate-500">Please try again. If it keeps happening, refresh the page.</p>
      <button onClick={reset} className="btn-primary mt-6">Try again</button>
    </div>
  );
}
