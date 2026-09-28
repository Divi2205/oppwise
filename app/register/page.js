import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";

export default async function RegisterPage() {
  if (await getUser()) redirect("/feed");
  return (
    <AuthShell title="Create your account">
      <AuthForm mode="register" />
    </AuthShell>
  );
}
