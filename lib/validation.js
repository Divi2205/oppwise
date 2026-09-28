// Zod schemas shared by the browser forms and the API routes, so the rules can't drift apart.
import { z } from "zod";
import { SKILLS } from "./skills.js";

export const TYPES = ["internship", "hackathon", "workshop", "certification", "competition", "job", "event"];
export const MODES = ["online", "offline", "hybrid"];
export const BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIML", "DS"];
export const PIPELINE = ["interested", "applied", "shortlisted", "completed"];
const skillIds = SKILLS.map((s) => s.id);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
const optDate = z.union([isoDate, z.literal(""), z.null()]).optional().transform((v) => v || null);
const cleanStr = (max) => z.string().trim().max(max).transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""));

export const registerSchema = z.object({
  name: cleanStr(80).pipe(z.string().min(2, "Enter your name")),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(100),
  year: z.coerce.number().int().min(1).max(5),
  branch: z.enum(BRANCHES),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  name: cleanStr(80).pipe(z.string().min(2)),
  year: z.coerce.number().int().min(1).max(5),
  branch: z.enum(BRANCHES),
  cgpa: z.union([z.coerce.number().min(0).max(10), z.literal(""), z.null()]).optional().transform((v) => (v === "" || v == null ? null : v)),
  skills: z.array(z.enum(skillIds)).max(30),
});

export const opportunitySchema = z
  .object({
    title: cleanStr(140).pipe(z.string().min(4, "Title is too short")),
    org: cleanStr(100).optional().nullable().transform((v) => v || null),
    type: z.enum(TYPES),
    description: cleanStr(4000).optional().default(""),
    link: z.union([z.string().trim().url("Enter a valid URL").max(500), z.literal(""), z.null()]).optional().transform((v) => v || null),
    deadline: optDate,
    eventStart: optDate,
    eventEnd: optDate,
    mode: z.union([z.enum(MODES), z.literal(""), z.null()]).optional().transform((v) => v || null),
    reward: cleanStr(120).optional().nullable().transform((v) => v || null),
    eligibleYears: z.array(z.coerce.number().int().min(1).max(5)).max(5).default([]),
    eligibleBranches: z.array(z.enum(BRANCHES)).max(8).default([]),
    minCgpa: z.union([z.coerce.number().min(0).max(10), z.literal(""), z.null()]).optional().transform((v) => (v === "" || v == null ? null : v)),
    skills: z.array(z.enum(skillIds)).max(15).default([]),
  })
  .refine((o) => !o.eventStart || !o.eventEnd || o.eventEnd >= o.eventStart, { message: "Event end must be after start", path: ["eventEnd"] })
  .refine((o) => o.deadline || o.link, { message: "Add at least a deadline or a link", path: ["deadline"] });

export const importSchema = z.object({
  text: cleanStr(6000).pipe(z.string().min(15, "Paste a bit more text so we can read it")),
  url: z.union([z.string().trim().url().max(500), z.literal(""), z.null()]).optional().transform((v) => v || null),
  source: z.enum(["paste", "share", "poster"]).default("paste"),
  // Optional corrections the student made on the preview screen.
  overrides: opportunitySchema.innerType().innerType().partial().optional(),
});

export const bookmarkSchema = z.object({
  status: z.enum(PIPELINE).optional(),
  note: cleanStr(500).optional(),
});

export const calendarSchema = z
  .object({
    title: cleanStr(80).pipe(z.string().min(2)),
    kind: z.enum(["exam", "holiday"]),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((c) => c.endDate >= c.startDate, { message: "End date must be on or after start", path: ["endDate"] });

export const reportSchema = z.object({ reason: cleanStr(200).pipe(z.string().min(3, "Tell us what's wrong")) });

export const queueActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
  action: z.enum(["approve", "reject"]),
});

// Converts a ZodError into { field: message } for inline form errors.
export function fieldErrors(err) {
  const out = {};
  for (const i of err.issues) {
    const k = i.path.join(".") || "_";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
