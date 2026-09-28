import { test } from "node:test";
import assert from "node:assert/strict";
import { mapUnstop, mapDevfolio } from "../lib/sync.js";

test("maps an Unstop hackathon to our fields (deadline in India time)", () => {
  const m = mapUnstop({
    title: "Perceptron Hackathon 2026 ",
    organisation: { name: "IIT Bombay" },
    seo_url: "https://unstop.com/hackathons/perceptron-hackathon-2026-iit-bombay-1761822",
    region: "offline",
    regnRequirements: { end_regn_dt: "2026-10-10T00:00:00+05:30" },
    required_skills: [{ skill_name: "Artificial Intelligence (AI)" }, { skill_name: "Python" }],
    prizes: [{ cash: 20000 }, { cash: 10000 }],
  }, "hackathon");
  assert.equal(m.title, "Perceptron Hackathon 2026");
  assert.equal(m.org, "IIT Bombay");
  assert.equal(m.deadline, "2026-10-10");
  assert.equal(m.mode, "offline");
  assert.equal(m.reward, "Prizes worth ₹30,000");
  assert.ok(m.skills.includes("python"));
  assert.match(m.link, /^https:\/\/unstop\.com\//);
});

test("maps an Unstop internship stipend", () => {
  const m = mapUnstop({ title: "Marketing Intern", public_url: "internships/x-1", region: "online",
    end_date: "2026-10-09T23:59:59+05:30", jobDetail: { show_salary: 1, min_salary: 8000, max_salary: 10000 } }, "internship");
  assert.equal(m.reward, "Stipend ₹8,000–₹10,000");
  assert.equal(m.link, "https://unstop.com/internships/x-1");
  assert.equal(m.deadline, "2026-10-09");
});

test("maps a Devfolio hackathon, converting UTC deadlines to the Indian date", () => {
  const m = mapDevfolio({ name: "CodeStorm 2026", slug: "codestorm", tagline: "Build the future", is_online: true,
    starts_at: "2026-10-02T18:30:00+00:00", ends_at: "2026-10-04T18:29:00+00:00",
    themes: [{ name: "Web" }], hackathon_setting: { reg_ends_at: "2026-09-29T18:29:00+00:00" } });
  assert.equal(m.deadline, "2026-09-29");
  assert.equal(m.eventStart, "2026-10-03");
  assert.equal(m.eventEnd, "2026-10-04");
  assert.equal(m.link, "https://codestorm.devfolio.co/");
  assert.equal(m.mode, "online");
});

test("skips entries without a title", () => {
  assert.equal(mapUnstop({ title: "  " }, "hackathon"), null);
  assert.equal(mapDevfolio({ name: "X" }), null);
});
