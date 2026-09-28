import { test } from "node:test";
import assert from "node:assert/strict";
import { findClashes } from "../lib/clash.js";
import { computeVerdict } from "../lib/verdict.js";
import { buildPrepPlan } from "../lib/prep.js";
import { dedupKey } from "../lib/dedup.js";
import { decide } from "../lib/moderation.js";

const TODAY = "2026-09-27";
const CAL = [{ title: "Cycle Test 2", kind: "exam", start_date: "2026-10-06", end_date: "2026-10-10" }];
const STUDENT = { year: 3, branch: "CSE", cgpa: 8.4, skills: ["java", "dsa", "oops"] };
const opp = (o) => ({ eligible_years: [], eligible_branches: [], min_cgpa: null, skills: [], scam_level: "none", scam_flags: [], source: "admin", dup_count: 1, deadline: null, event_start: null, event_end: null, ...o });

test("detects event dates inside an exam period", () => {
  const c = findClashes(opp({ deadline: "2026-10-01", event_start: "2026-10-08", event_end: "2026-10-09" }), CAL);
  assert.equal(c.length, 1);
  assert.equal(c[0].what, "event");
});

test("verdict: go / tight / skip", () => {
  assert.equal(computeVerdict(STUDENT, opp({ deadline: "2026-10-20", skills: ["java"] }), CAL, TODAY).verdict, "go");
  assert.equal(computeVerdict(STUDENT, opp({ deadline: "2026-10-20", skills: ["java", "dbms"] }), CAL, TODAY).verdict, "tight");
  assert.equal(computeVerdict(STUDENT, opp({ deadline: "2026-10-20", eligible_years: [4] }), CAL, TODAY).verdict, "skip");
  assert.equal(computeVerdict(STUDENT, opp({ deadline: "2026-10-20", scam_level: "high", scam_flags: [{ reason: "Asks for a fee" }] }), CAL, TODAY).verdict, "skip");
});

test("prep plan skips exam days", () => {
  const p = buildPrepPlan(["dbms"], "2026-10-11", CAL, TODAY);
  const days = p.plan[0].days;
  assert.equal(days.length, 2);
  assert.ok(days.every((d) => d < "2026-10-06" || d > "2026-10-10"));
  assert.equal(p.skipped.length, 5);
});

test("same link with tracking params gives the same duplicate key", () => {
  assert.equal(dedupKey({ link: "https://www.unstop.com/h/abc?utm_source=wa" }), dedupKey({ link: "https://unstop.com/h/abc/" }));
});

test("moderation: admin publishes, new contributor goes to review, junk is rejected", () => {
  const good = { fields: { title: "Hackathon X", link: "https://x.io", deadline: "2026-10-10" }, confidence: { title: "high", type: "high", link: "high", deadline: "high" }, scam: { level: "none", flags: [] }, source: "paste" };
  assert.equal(decide({ ...good, submitter: { role: "admin" } }).status, "published");
  assert.equal(decide({ ...good, submitter: { role: "student", approved_count: 0, rejected_count: 0 } }).status, "pending");
  assert.equal(decide({ ...good, submitter: { role: "student", approved_count: 5, rejected_count: 0 } }).status, "published");
  assert.equal(decide({ ...good, fields: { title: "" }, submitter: { role: "admin" } }).status, "rejected");
});
