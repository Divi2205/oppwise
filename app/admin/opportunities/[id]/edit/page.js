import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getOpportunity } from "@/lib/opportunities";
import OppForm from "@/components/OppForm";

export const dynamic = "force-dynamic";

export default async function EditOpportunity({ params }) {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/feed");
  const o = await getOpportunity(Number(params.id));
  if (!o) notFound();
  const initial = {
    title: o.title, org: o.org || "", type: o.type, description: o.description, link: o.link || "", deadline: o.deadline || "",
    eventStart: o.event_start || "", eventEnd: o.event_end || "", mode: o.mode || "", reward: o.reward || "",
    eligibleYears: o.eligible_years, eligibleBranches: o.eligible_branches, minCgpa: o.min_cgpa ?? "", skills: o.skills,
  };
  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker">Admin</p>
      <h1 className="mb-6 text-3xl font-extrabold">Edit opportunity</h1>
      <OppForm id={o.id} initial={initial} />
    </div>
  );
}
