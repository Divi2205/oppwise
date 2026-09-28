import { handler, json, readJson } from "@/lib/api";
import { requireUser, requireAdmin } from "@/lib/auth";
import { calendarSchema } from "@/lib/validation";
import { getCalendar } from "@/lib/opportunities";
import { one } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireUser();
  return json({ items: await getCalendar() });
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const c = calendarSchema.parse(await readJson(req));
  const row = await one(`INSERT INTO calendar_events (title, kind, start_date, end_date) VALUES ($1,$2,$3,$4) RETURNING id`, [c.title, c.kind, c.startDate, c.endDate]);
  return json({ id: row.id }, 201);
});
