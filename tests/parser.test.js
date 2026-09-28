import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOpportunity, batchToYear } from "../lib/parser.js";

const REF = new Date(2026, 8, 27); // 27 Sep 2026

const FORWARD = `🚀 *HackVerse 2026 — 24-hour National Hackathon* 🚀
Organised by Tech Society
Open to 2nd, 3rd and final year students of CSE, IT and AIML.
Build with React, Node.js and any cloud platform. Prize pool ₹75,000 💰
Hackathon on 24-25 October, offline at the main auditorium.
Last date to register: 15 October
No registration fee!
Register here 👉 https://forms.gle/hackverse2026demo`;

test("extracts every key field from a WhatsApp forward", () => {
  const { fields, confidence } = parseOpportunity(FORWARD, { ref: REF });
  assert.equal(fields.title, "HackVerse 2026 — 24-hour National Hackathon");
  assert.equal(fields.org, "Tech Society");
  assert.equal(fields.type, "hackathon");
  assert.equal(fields.link, "https://forms.gle/hackverse2026demo");
  assert.equal(fields.deadline, "2026-10-15");
  assert.equal(fields.eventStart, "2026-10-24");
  assert.equal(fields.eventEnd, "2026-10-25");
  assert.equal(fields.mode, "offline");
  assert.deepEqual(fields.eligibleYears, [2, 3, 4]);
  assert.deepEqual(fields.eligibleBranches, ["CSE", "IT", "AIML"]);
  assert.ok(fields.skills.includes("react") && fields.skills.includes("node"));
  assert.ok(!fields.skills.includes("ml"), "AIML as a branch must not become an ML skill");
  assert.equal(confidence.deadline, "high");
});

test("marks the deadline uncertain when no deadline wording is present", () => {
  const { confidence } = parseOpportunity("Tech talk on cloud careers\n12 October\nhttps://x.io/talk", { ref: REF });
  assert.equal(confidence.deadline, "low");
});

test("reads CGPA and graduation batch", () => {
  const { fields } = parseOpportunity("SDE internship for the 2028 batch. Minimum CGPA 7.5. Apply by 10 Oct https://careers.x.com/apply", { ref: REF });
  assert.equal(fields.minCgpa, 7.5);
  assert.deepEqual(fields.eligibleYears, [3]);
  assert.equal(fields.type, "internship");
});

test("maps graduation year to current study year", () => {
  assert.equal(batchToYear(2027, REF), 4);
  assert.equal(batchToYear(2030, REF), 1);
  assert.equal(batchToYear(2035, REF), null);
});
