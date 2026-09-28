import { handler, json, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { one } from "@/lib/db";

export const GET = handler(async () => json({ user: await requireUser() }));

export const PATCH = handler(async (req) => {
  const user = await requireUser();
  const p = profileSchema.parse(await readJson(req));
  await one(`UPDATE users SET name=$1, year=$2, branch=$3, cgpa=$4, skills=$5::jsonb WHERE id=$6 RETURNING id`,
    [p.name, p.year, p.branch, p.cgpa, JSON.stringify([...new Set(p.skills)]), user.id]);
  return json({ ok: true });
});
