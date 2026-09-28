import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker">Profile</p>
      <h1 className="mb-2 text-3xl font-extrabold">Your profile powers every verdict</h1>
      <p className="mb-6 text-slate-600">Year, branch and CGPA decide eligibility. Skills decide your match percentage and your prep plan.</p>
      <ProfileForm user={user} />
    </div>
  );
}
