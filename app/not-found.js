import Link from "next/link";
export default function NotFound() {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <p className="text-5xl font-extrabold text-brand">404</p>
      <p className="mt-2 text-lg font-semibold">We couldn't find that page</p>
      <p className="mt-1 text-sm text-slate-500">It may have been removed, or it's still waiting for review.</p>
      <Link href="/feed" className="btn-primary mt-6">Back to the feed</Link>
    </div>
  );
}
