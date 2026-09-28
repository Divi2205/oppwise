import { z } from "zod";
import { handler, json, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { SKILLS } from "@/lib/skills";
import { one } from "@/lib/db";

const schema = z.object({ skill: z.enum(SKILLS.map((s) => s.id)), ready: z.boolean() });

// "Mark as ready" from the Prep panel: adds/removes a skill, which updates match % and the verdict.
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { skill, ready } = schema.parse(await readJson(req));
  const set = new Set(user.skills || []);
  ready ? set.add(skill) : set.delete(skill);
  await one(`UPDATE users SET skills=$1::jsonb WHERE id=$2 RETURNING id`, [JSON.stringify([...set]), user.id]);
  return json({ skills: [...set] });
});
