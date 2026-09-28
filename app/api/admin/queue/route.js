import { handler, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listOpportunities, recordModeration } from "@/lib/opportunities";
import { queueActionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireAdmin();
  return json({ items: await listOpportunities({ status: "pending", includePast: true }) });
});

// Bulk approve / reject
export const POST = handler(async (req) => {
  await requireAdmin();
  const { ids, action } = queueActionSchema.parse(await readJson(req));
  const updated = await recordModeration(ids, action);
  return json({ updated });
});
