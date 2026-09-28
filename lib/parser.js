// Smart Import parser.
// Rule-based on purpose: it is fast, free, works offline and every decision can be explained.
// Each extracted field gets a confidence level so uncertain fields can be highlighted for review.
import * as chrono from "chrono-node";
import { toISODate } from "./dates.js";
import { extractSkills } from "./skills.js";

const TYPE_RULES = [
  ["hackathon", /\b(hackathon|hack-?a-?thon|buildathon|ideathon|designathon|codathon)\b/i],
  ["internship", /\b(internship|intern|interns|stipend)\b/i],
  ["job", /\b(full[- ]time|job opening|hiring|job role|ctc|lpa|placement drive)\b/i],
  ["competition", /\b(competition|contest|challenge|quiz|olympiad|case study)\b/i],
  ["certification", /\b(certification|certified|certificate course|course)\b/i],
  ["workshop", /\b(workshop|bootcamp|webinar|masterclass|hands-on session|training session)\b/i],
  ["event", /\b(event|fest|seminar|talk|meetup|symposium|conference)\b/i],
];

const DEADLINE_HINT = /(deadline|last date|register by|registration closes|registrations close|apply by|apply before|closes on|closing on|before|till|until|ends on|due)/i;
const EVENT_HINT = /(event on|held on|scheduled on|happening on|conducted on|date of event|event date|from|starts|hackathon on|workshop on|dates?)/i;

const BRANCHES = [
  ["CSE", /\b(cse|computer science)\b/i],
  ["IT", /\b(it branch|information technology|\bIT\b)\b/],
  ["ECE", /\b(ece|electronics and communication)\b/i],
  ["EEE", /\b(eee|electrical)\b/i],
  ["MECH", /\b(mech|mechanical)\b/i],
  ["CIVIL", /\b(civil)\b/i],
  ["AIML", /\b(aiml|ai\s*&\s*ml|artificial intelligence)\b/i],
  ["DS", /\b(data science)\b/i],
];

// Academic year of students who graduate in a given year.
// e.g. in Sept 2026, the "2027 batch" are final (4th) years.
export function batchToYear(gradYear, ref = new Date()) {
  const finalYearGrad = ref.getMonth() >= 6 ? ref.getFullYear() + 1 : ref.getFullYear();
  const year = 4 - (gradYear - finalYearGrad);
  return year >= 1 && year <= 4 ? year : null;
}

function cleanText(raw) {
  return String(raw || "")
    .replace(/\r/g, "")
    .replace(/[*_~]{1,3}(\S[^*_~\n]*?)[*_~]{1,3}/g, "$1") // WhatsApp *bold* / _italic_
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function stripDecorations(line) {
  return line
    .replace(/^[^\p{L}\p{N}"'(]+/u, "") // leading emojis, bullets, symbols
    .replace(/[^\p{L}\p{N}.)!?'"]+$/u, "")
    .trim();
}

function extractLinks(text) {
  const links = text.match(/https?:\/\/[^\s<>()"']+/gi) || [];
  return links.map((l) => l.replace(/[.,;:!?)\]]+$/, ""));
}

function pickLink(links) {
  const preferred = links.find((l) => /(register|registration|apply|forms\.gle|docs\.google\.com\/forms|unstop|devfolio|devpost|internshala|careers|jobs|hack2skill|lu\.ma)/i.test(l));
  return preferred || links[0] || null;
}

function extractTitle(lines) {
  const labelled = lines.find((l) => /^(title|event|opportunity|role|position)\s*[:\-]/i.test(stripDecorations(l)));
  if (labelled) return { value: stripDecorations(labelled).replace(/^[^:\-]+[:\-]\s*/, "").slice(0, 100), confidence: "high" };
  for (const l of lines) {
    const s = stripDecorations(l);
    if (!s || /^https?:\/\//i.test(s)) continue;
    if (s.length < 6) continue;
    if (/^(hi|hello|dear|greetings|attention|important|urgent|hey)\b/i.test(s) && s.length < 40) continue;
    const value = s.length > 100 ? s.slice(0, 97).trimEnd() + "…" : s;
    return { value, confidence: s.length <= 80 ? "high" : "low" };
  }
  return { value: "", confidence: "low" };
}

function extractOrg(text) {
  const patterns = [
    /(?:organi[sz]ed by|hosted by|presented by|conducted by|powered by|offered by)\s*:?\s*([A-Z][\w&.,' -]{2,60}?)(?=[\n.,!|(]|\s+(?:is|are|on|for|in)\b|$)/i,
    /(?:company|organi[sz]ation|organizer)\s*[:\-]\s*([^\n.,|]{2,60})/i,
    /\b([A-Z][\w&.' -]{1,40}?)\s+is\s+(?:hiring|looking for|inviting)/,
    /\b(?:at|@)\s+([A-Z][\w&.' -]{1,40}?)(?=[\n.,!|]|\s+(?:for|in|on)\b)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return { value: m[1].trim().replace(/\s{2,}/g, " "), confidence: "high" };
  }
  return { value: "", confidence: "low" };
}

function extractType(text) {
  const hits = TYPE_RULES.filter(([, re]) => re.test(text)).map(([t]) => t);
  if (!hits.length) return { value: "event", confidence: "low" };
  return { value: hits[0], confidence: hits.length === 1 || hits[0] === "hackathon" ? "high" : "medium" };
}

function extractDates(text, ref) {
  const results = chrono.parse(text, ref, { forwardDate: true });
  let deadline = null, deadlineConf = "low", eventStart = null, eventEnd = null;
  for (const r of results) {
    const before = text.slice(Math.max(0, r.index - 45), r.index);
    const start = toISODate(r.start.date());
    const end = r.end ? toISODate(r.end.date()) : null;
    if (!deadline && DEADLINE_HINT.test(before) && !end) {
      deadline = start;
      deadlineConf = "high";
    } else if (!eventStart && (end || EVENT_HINT.test(before))) {
      eventStart = start;
      eventEnd = end || start;
    }
  }
  if (!deadline && results.length) {
    // Fall back to the earliest remaining date, but mark it uncertain.
    const first = results.map((r) => toISODate(r.start.date())).sort()[0];
    deadline = eventStart && first === eventStart ? addDaysSafe(eventStart, -1) : first;
    deadlineConf = "low";
  }
  if (eventStart && deadline && deadline > eventStart) deadlineConf = "low";
  return { deadline, deadlineConf, eventStart, eventEnd };
}

function addDaysSafe(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + n));
}

function extractEligibility(text, ref) {
  const years = new Set();
  const ordinal = { first: 1, "1st": 1, second: 2, "2nd": 2, third: 3, "3rd": 3, fourth: 4, "4th": 4, final: 4, "pre-final": 3, prefinal: 3 };
  for (const m of text.matchAll(/\b(1st|2nd|3rd|4th|first|second|third|fourth|pre-?final|final)(?:\s*(?:,|\/|&|and|or)\s*(1st|2nd|3rd|4th|first|second|third|fourth|pre-?final|final))*\s*[- ]?\s*years?\b/gi)) {
    for (const tok of m[0].toLowerCase().match(/1st|2nd|3rd|4th|first|second|third|fourth|pre-?final|final/g)) {
      years.add(ordinal[tok.replace("-", "")] || ordinal[tok]);
    }
  }
  for (const m of text.matchAll(/\b(20[2-3]\d)\s*(?:batch|graduates|graduating|passouts?|pass-?outs?)\b/gi)) {
    const y = batchToYear(Number(m[1]), ref);
    if (y) years.add(y);
  }
  if (/\ball years\b|\bopen to all\b/i.test(text)) years.clear();

  let branches = [];
  if (!/\ball branches\b|\bany branch\b|\bopen to all\b/i.test(text)) {
    const eligLine = (text.match(/(eligib[^\n]*|open to[^\n]*|who can apply[^\n]*)/i) || [""])[0];
    if (eligLine) branches = BRANCHES.filter(([, re]) => re.test(eligLine)).map(([b]) => b);
  }

  const cg = text.match(/\b(?:cgpa|gpa)\s*(?:of|>=|≥|above|minimum|min\.?|:|-|at least)?\s*(\d{1,2}(?:\.\d{1,2})?)/i)
    || text.match(/(\d{1,2}(?:\.\d{1,2})?)\s*\+?\s*(?:cgpa|gpa)/i);
  const minCgpa = cg && Number(cg[1]) <= 10 ? Number(cg[1]) : null;

  return { years: [...years].sort(), branches, minCgpa };
}

function extractMode(text) {
  if (/\bhybrid\b/i.test(text)) return "hybrid";
  if (/\b(online|virtual|remote|work from home|wfh)\b/i.test(text)) return "online";
  if (/\b(offline|in-person|in person|on-campus|on campus|venue)\b/i.test(text)) return "offline";
  return null;
}

function extractReward(text) {
  const m = text.match(/(prize pool|prizes? worth|stipend|ctc|package)[^\n₹\d]{0,20}(₹|rs\.?|inr)?\s?[\d,.]+\s*(k|lpa|lakhs?|l)?(\s*\/\s*month)?/i)
    || text.match(/(₹|rs\.?|inr)\s?[\d,.]+\s*(k|lakhs?|lpa)?\s*(prize|stipend|per month|\/month)/i);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

export function parseOpportunity(raw, { url = null, ref = new Date() } = {}) {
  const text = cleanText([raw, url].filter(Boolean).join("\n"));
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const links = extractLinks(text);
  const link = pickLink(links);
  const title = extractTitle(lines);
  const org = extractOrg(text);
  const type = extractType(text);
  const dates = extractDates(text, ref);
  const elig = extractEligibility(text, ref);

  const fields = {
    title: title.value,
    org: org.value || null,
    type: type.value,
    link,
    deadline: dates.deadline,
    eventStart: dates.eventStart,
    eventEnd: dates.eventEnd,
    mode: extractMode(text),
    reward: extractReward(text),
    eligibleYears: elig.years,
    eligibleBranches: elig.branches,
    minCgpa: elig.minCgpa,
    skills: extractSkills(text),
    description: text.slice(0, 2000),
  };
  const confidence = {
    title: title.confidence,
    org: org.confidence,
    type: type.confidence,
    link: link ? (links.length === 1 || /register|apply|forms/i.test(link) ? "high" : "medium") : "low",
    deadline: dates.deadlineConf,
  };
  return { fields, confidence, links };
}

export const KEY_FIELDS = ["title", "type", "link", "deadline"];

export function isConfident(confidence) {
  return KEY_FIELDS.every((k) => confidence[k] === "high");
}
