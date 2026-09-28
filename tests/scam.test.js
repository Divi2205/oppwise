import { test } from "node:test";
import assert from "node:assert/strict";
import { checkScam } from "../lib/scam.js";

test("flags fee + guarantee + personal email as high risk, with reasons", () => {
  const r = checkScam("Guaranteed internship! Pay ₹499 registration fee. Contact hr.jobs@gmail.com");
  assert.equal(r.level, "high");
  const ids = r.flags.map((f) => f.id);
  assert.ok(ids.includes("fee") && ids.includes("guaranteed") && ids.includes("personal-email"));
  assert.ok(r.flags.every((f) => f.reason.length > 0));
});

test("does not flag 'No registration fee'", () => {
  assert.equal(checkScam("National hackathon. No registration fee! Prize pool ₹50,000").level, "none");
});

test("a stipend per month is not an earnings scam", () => {
  assert.equal(checkScam("Internship with stipend ₹15,000 per month").level, "none");
});

test("shortened links alone are only a low-level flag", () => {
  const r = checkScam("Workshop registrations open", ["https://bit.ly/abc"]);
  assert.equal(r.level, "low");
});
