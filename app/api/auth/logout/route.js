import { handler, json } from "@/lib/api";
import { clearSession } from "@/lib/auth";
export const POST = handler(async () => {
  clearSession();
  return json({ ok: true });
});
