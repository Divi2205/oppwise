import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getOpportunity } from "@/lib/opportunities";
import { formatDate } from "@/lib/dates";
import ApplyConfirm from "@/components/ApplyConfirm";

export const dynamic = "force-dynamic";

// Placeholder links used in demo data and samples are never shown as clickable.
function realLink(link) {
  if (!link) return null;
  try {
    const u = new URL(link);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (/(^|\.)example\.(com|org|net)$/i.test(u.hostname) || /demo/i.test(u.pathname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default async function ApplyPage({ params }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const id = Number(params.id);
  const o = Number.isInteger(id) ? await getOpportunity(id, user.id) : null;
  if (!o || o.status !== "published") notFound();
  return (
    <div className="py-6">
      <ApplyConfirm
        id={o.id}
        title={o.title}
        org={o.org}
        deadlineText={o.deadline ? formatDate(o.deadline) : ""}
        status={o.my_status}
        externalLink={realLink(o.link)}
        sourceName={{ unstop: "Unstop", devfolio: "Devfolio" }[o.source] || null}
      />
    </div>
  );
}
