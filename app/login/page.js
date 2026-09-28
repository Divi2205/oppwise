import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";

export default async function LoginPage() {
  if (await getUser()) redirect("/feed");
  return (
    <AuthShell
      title="Log in"
      aside={
        <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm">
          <p className="font-semibold text-lime">Demo accounts</p>
          <ul className="mt-2 space-y-1 text-white/85">
            <li>Student: student@srmist.edu.in / Student@123</li>
            <li>Admin: admin@srmist.edu.in / Admin@123</li>
          </ul>
        </div>
      }
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
