import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import ImportForm from "@/components/ImportForm";

export const dynamic = "force-dynamic";

// Also the WhatsApp share target: the phone opens /import?title=…&text=…&url=…
export default async function ImportPage({ searchParams }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const take = (k) => (typeof searchParams[k] === "string" ? searchParams[k].slice(0, 6000) : "");
  const text = [take("title"), take("text")].filter(Boolean).join("\n");
  return (
    <div>
      <div className="mb-6">
        <p className="kicker">Smart Import</p>
        <h1 className="text-3xl font-extrabold">Capture an opportunity</h1>
        <p className="mt-1 max-w-2xl text-slate-600">
          Paste a forward, snap a poster, or share straight from WhatsApp (install OppWise from your browser menu on Android, then choose it in the share sheet).
        </p>
      </div>
      <ImportForm initial={{ text, url: take("url") }} />
    </div>
  );
}
