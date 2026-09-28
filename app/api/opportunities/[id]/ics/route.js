import { handler } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { getOpportunity } from "@/lib/opportunities";
import { buildIcs } from "@/lib/ics";

export const GET = handler(async (req, { params }) => {
  const user = await requireUser();
  const opp = await getOpportunity(Number(params.id), user.id);
  if (!opp || opp.status !== "published") throw new HttpError(404, "Not found");
  const origin = new URL(req.url).origin;
  return new Response(buildIcs(opp, origin), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="oppwise-${opp.id}.ics"`,
    },
  });
});
