// Creates tables and loads realistic demo data.
// Used by `npm run db:setup` (full reset), by the admin "Reset demo data" button,
// and automatically on the very first request when the database is empty.
// Dates are relative to today, so the demo always has upcoming deadlines and a nearby exam week.
import bcrypt from "bcryptjs";
import { SCHEMA_SQL, DROP_SQL, statements } from "./schema.js";
import { saveOpportunity } from "./opportunities.js";
import { checkScam } from "./scam.js";
import { today, addDays } from "./dates.js";

// Demo listings are fictional, so their links are placeholders; "Register" uses the in-app page instead.
const isPlaceholder = (link) => !link || /example\.(com|org|net)/i.test(link);

export async function initDatabase(client, { reset = false } = {}) {
  const q = async (text, params = []) => (await client.query(text, params)).rows;
  const one = async (text, params = []) => (await q(text, params))[0] || null;
  const query = q;
  if (reset) for (const s of statements(DROP_SQL)) await q(s);
  for (const s of statements(SCHEMA_SQL)) await q(s);

  const T = today();
  const D = (n) => addDays(T, n);

  // ---------- users ----------
  const hash = (pw) => bcrypt.hash(pw, 10);
  async function addUser(u) {
    const row = await one(
      `INSERT INTO users (name, email, password_hash, role, year, branch, cgpa, skills, approved_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) RETURNING id`,
      [u.name, u.email, await hash(u.password), u.role || "student", u.year ?? null, u.branch ?? null, u.cgpa ?? null, JSON.stringify(u.skills || []), u.approved || 0]
    );
    return row.id;
  }
  const admin = await addUser({ name: "Opportunity Cell (Admin)", email: "admin@srmist.edu.in", password: "Admin@123", role: "admin" });
  const aarav = await addUser({ name: "Aarav Sharma", email: "student@srmist.edu.in", password: "Student@123", year: 3, branch: "CSE", cgpa: 8.4, skills: ["java", "dsa", "oops", "git", "html-css", "javascript", "python"] });
  const meera = await addUser({ name: "Meera Iyer", email: "student2@srmist.edu.in", password: "Student@123", year: 2, branch: "ECE", cgpa: 7.6, skills: ["python", "cpp", "html-css"] });
  const rahul = await addUser({ name: "Rahul Verma", email: "rahul@srmist.edu.in", password: "Student@123", year: 4, branch: "CSE", cgpa: 8.9, skills: ["java", "spring", "dbms", "dsa"], approved: 5 });

  // ---------- academic calendar ----------
  const cal = [
    ["Cycle Test 2", "exam", D(9), D(13)],
    ["Holiday", "holiday", D(20), D(21)],
    ["Model Exams", "exam", D(40), D(46)],
  ];
  for (const c of cal) await query(`INSERT INTO calendar_events (title, kind, start_date, end_date) VALUES ($1,$2,$3,$4)`, c);

  // ---------- opportunities ----------
  const none = { level: "none", flags: [] };
  const base = { org: null, description: "", link: null, deadline: null, eventStart: null, eventEnd: null, mode: null, reward: null, eligibleYears: [], eligibleBranches: [], minCgpa: null, skills: [] };
  async function opp(fields, meta = {}) {
    const f = { ...base, ...fields };
    const r = await saveOpportunity({ ...f, link: isPlaceholder(f.link) ? null : f.link }, { source: "admin", status: "published", scam: none, confidence: {}, reasons: [], submittedBy: admin, ...meta }, one);
    return r.id;
  }

  const ids = {};
  ids.sde = await opp({ title: "SDE Intern — Summer 2027", org: "Nimbus Labs", type: "internship", link: "https://careers.example.com/nimbus/sde-intern", deadline: D(12), mode: "hybrid", reward: "Stipend ₹40,000/month", eligibleYears: [3, 4], eligibleBranches: ["CSE", "IT", "AIML", "DS"], minCgpa: 7.5, skills: ["java", "dsa", "dbms", "oops"],
    description: "Nimbus Labs is hiring software engineering interns for a 10-week summer internship. Online test (2 coding questions + aptitude) followed by a technical interview. Strong DSA and DBMS fundamentals expected." });
  ids.hack = await opp({ title: "HackSRM Build Weekend", org: "Coding Club", type: "hackathon", link: "https://forms.example.com/hacksrm-build-weekend", deadline: D(15), eventStart: D(18), eventEnd: D(19), mode: "offline", reward: "Prize pool ₹1,00,000", skills: ["react", "node", "git"],
    description: "A 36-hour on-campus hackathon. Teams of 2–4. Themes: campus life, sustainability and fintech. Food and swags provided. No registration fee." });
  ids.ideathon = await opp({ title: "Open Innovation Ideathon", org: "Innovation Council", type: "hackathon", link: "https://forms.example.com/open-ideathon", deadline: D(7), eventStart: D(10), eventEnd: D(11), mode: "offline",
    description: "Pitch a solution to a real campus problem. Shortlisted teams present to a jury of faculty and alumni founders." });
  ids.frontend = await opp({ title: "Frontend Developer Intern (Remote)", org: "Pixelcraft Studio", type: "internship", link: "https://careers.example.com/pixelcraft/frontend-intern", deadline: D(20), mode: "online", reward: "Stipend ₹15,000/month", skills: ["javascript", "html-css", "git"],
    description: "3-month remote internship building responsive web pages and small UI components. Portfolio or GitHub link required." });
  ids.contest = await opp({ title: "Data Structures Contest — Round 1", org: "Competitive Programming Club", type: "competition", link: "https://contest.example.com/dsa-round-1", deadline: D(5), eventStart: D(6), eventEnd: D(6), mode: "online", skills: ["dsa"],
    description: "90-minute online contest with 4 problems. Top 50 qualify for the on-campus final." });
  ids.mlws = await opp({ title: "Hands-on Machine Learning Workshop", org: "AI Club", type: "workshop", link: "https://forms.example.com/ml-workshop", deadline: D(22), eventStart: D(24), eventEnd: D(24), mode: "offline",
    description: "Beginner-friendly: build and evaluate your first classifier. Bring a laptop with Python installed." });
  ids.design = await opp({ title: "Product Design Challenge", org: "Design Society", type: "competition", link: "https://forms.example.com/design-challenge", deadline: D(17), mode: "online", skills: ["uiux"],
    description: "Redesign a campus app screen in Figma. Winners get mentorship sessions with product designers." });
  ids.get = await opp({ title: "Graduate Engineer Trainee", org: "Vertex Systems", type: "job", link: "https://careers.example.com/vertex/get-2027", deadline: D(30), mode: "offline", reward: "CTC 6.5 LPA", eligibleYears: [4], minCgpa: 7, skills: ["java", "dbms"],
    description: "Full-time role for the 2027 batch. Aptitude test, technical interview and HR round." });
  ids.research = await opp({ title: "Research Internship — NLP Lab", org: "Department of CSE", type: "internship", link: "https://forms.example.com/nlp-research-intern", deadline: D(26), mode: "offline", eligibleYears: [3, 4], minCgpa: 8.5, skills: ["python", "ml"],
    description: "Work with faculty on a text-classification project for one semester. Letter of recommendation on completion." });
  ids.smart = await opp({ title: "Smart Campus Hackathon", org: "IEEE Student Branch", type: "hackathon", link: "https://forms.example.com/smart-campus-hack", deadline: D(2), eventStart: D(4), eventEnd: D(5), mode: "hybrid", skills: ["python"],
    description: "Build IoT or software solutions for campus challenges. Registrations close soon." });
  ids.android = await opp({ title: "Android Study Jam", org: "Developer Student Club", type: "workshop", link: "https://forms.example.com/android-study-jam", deadline: D(14), eventStart: D(16), eventEnd: D(16), mode: "online",
    description: "Four-week guided programme to build your first Android app with Kotlin." });
  ids.oss = await opp({ title: "Open Source Contribution Month", org: "FOSS Club", type: "event", link: "https://forms.example.com/oss-month", deadline: D(28), mode: "online", skills: ["git"],
    description: "Make your first open-source pull requests with mentors. Certificates for 3+ merged PRs." });
  ids.web3 = await opp({ title: "Web3 Buildathon", org: "Blockchain Club", type: "hackathon", link: "https://forms.example.com/web3-buildathon", deadline: D(35), eventStart: D(41), eventEnd: D(42), mode: "offline", skills: ["javascript"],
    description: "48-hour buildathon on decentralised apps. Open to all years." });
  ids.case = await opp({ title: "Business Case Competition", org: "Entrepreneurship Cell", type: "competition", link: "https://forms.example.com/case-comp", deadline: D(18), mode: "offline",
    description: "Solve a real startup's growth problem in teams of three. Cash prizes for the top 3 teams." });
  ids.data = await opp({ title: "Data Analytics Virtual Internship", org: "Insight Analytics", type: "internship", link: "https://careers.example.com/insight/virtual-intern", deadline: D(24), mode: "online", skills: ["python", "data"],
    description: "Self-paced virtual internship with real datasets. Certificate on completion." });
  ids.cert = await opp({ title: "Cloud Practitioner Study Jam", org: "Cloud Community", type: "certification", link: "https://forms.example.com/cloud-study-jam", deadline: D(25), mode: "online",
    description: "Six guided sessions preparing you for an entry-level cloud certification exam." });
  ids.old = await opp({ title: "Intro to Git Workshop", org: "FOSS Club", type: "workshop", link: "https://forms.example.com/intro-git", deadline: D(-6), eventStart: D(-4), eventEnd: D(-4), mode: "offline",
    description: "Past workshop (kept for the demo student's history)." });

  // Popular listing: the same forward was shared by several students.
  await query(`UPDATE opportunities SET dup_count = 7, source = 'share' WHERE id = $1`, [ids.hack]);

  // Pending items for the review queue.
  const scamText = "URGENT!! Work-from-home internship for all students. Guaranteed internship certificate + letter of recommendation. Pay ₹999 registration fee to confirm your seat. Hurry, limited seats! Contact: hr.jobsindia@gmail.com";
  const scam = checkScam(scamText, []);
  await opp({ title: "Work From Home Internship — Guaranteed Certificate", org: null, type: "internship", description: scamText, deadline: D(3), mode: "online" },
    { source: "paste", status: "pending", scam, confidence: { title: "high", type: "high", link: "low", deadline: "high" }, reasons: [`Scam check: ${scam.level} risk`, "Unsure about: link", "Submitted by a new contributor"], submittedBy: meera });
  await opp({ title: "Tech Talk: Careers in Cybersecurity", org: "Cyber Security Club", type: "event", description: "Forwarded: tech talk this month, register soon! https://forms.example.com/cyber-talk", link: "https://forms.example.com/cyber-talk", deadline: D(8), mode: "offline" },
    { source: "share", status: "pending", scam: none, confidence: { title: "high", type: "high", link: "high", deadline: "low" }, reasons: ["Unsure about: deadline", "Submitted by a new contributor"], submittedBy: meera });
  await opp({ title: "Capture The Flag — Beginner Edition", org: "Cyber Security Club", type: "competition", link: "https://ctf.example.com/beginner", deadline: D(19), mode: "online", description: "Jeopardy-style CTF for beginners. Teams of up to 3." },
    { source: "paste", status: "pending", scam: none, confidence: { title: "high", type: "high", link: "high", deadline: "high" }, reasons: ["Submitted by a new contributor"], submittedBy: meera });

  // ---------- the demo student's pipeline ----------
  const bm = [[ids.sde, "interested"], [ids.hack, "applied"], [ids.contest, "applied"], [ids.oss, "shortlisted"], [ids.frontend, "interested"], [ids.old, "completed"], [ids.smart, "interested"]];
  for (const [oid, status] of bm) await query(`INSERT INTO bookmarks (user_id, opp_id, status) VALUES ($1,$2,$3)`, [aarav, oid, status]);
  // Other students' bookmarks (popularity signal)
  for (const oid of [ids.hack, ids.sde, ids.mlws, ids.contest]) await query(`INSERT INTO bookmarks (user_id, opp_id) VALUES ($1,$2)`, [rahul, oid]);
  for (const oid of [ids.hack, ids.mlws]) await query(`INSERT INTO bookmarks (user_id, opp_id) VALUES ($1,$2)`, [meera, oid]);

  // Live listings from Unstop and Devfolio (falls back to a saved snapshot when offline).
  try {
    const { runSync } = await import("./sync.js");
    await runSync(q);
  } catch (e) {
    console.warn("Initial sync skipped:", e?.message || e);
  }
}
