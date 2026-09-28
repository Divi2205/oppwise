import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import OppForm from "@/components/OppForm";

export default async function NewOpportunity() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/feed");
  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker">Admin</p>
      <h1 className="mb-6 text-3xl font-extrabold">Post an opportunity</h1>
      <OppForm />
    </div>
  );
}
