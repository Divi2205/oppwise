import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import Feed from "@/components/Feed";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const [live] = await query(
    `SELECT count(*) FILTER (WHERE source = 'unstop')::int AS unstop, count(*) FILTER (WHERE source = 'devfolio')::int AS devfolio,
            (SELECT max(ran_at) FROM sync_runs) AS synced
     FROM opportunities WHERE status = 'published' AND source IN ('unstop','devfolio') AND (deadline IS NULL OR deadline >= CURRENT_DATE)`
  );
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Your college feed</p>
          <h1 className="text-3xl font-extrabold">Hi {user.name.split(" ")[0]}, here's what's open</h1>
          <p className="mt-1 text-slate-600">Every card is checked against your profile and exam calendar.</p>
          {live && live.unstop + live.devfolio > 0 && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime" aria-hidden />
              {live.unstop + live.devfolio} live listings synced automatically from Unstop ({live.unstop}) and Devfolio ({live.devfolio})
            </p>
          )}
        </div>
        <Link href="/import" className="btn-primary">+ Import an opportunity</Link>
      </div>
      <Feed />
    </div>
  );
}
