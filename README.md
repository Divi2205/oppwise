# OppWise — never miss an opportunity worth taking

**Vision2Web FSWD Hackathon · Theme 1: Smart Campus & Student Life · Problem 5: Student Opportunity Tracker**

OppWise captures opportunities from wherever students find them (WhatsApp forwards, notice-board posters, links, admin posts), checks them for scams and duplicates, knows the college's exam calendar, and tells each student **"Should I apply?"** with a clear verdict and the reasons behind it.

---

## Quick start (about 2 minutes)

Requirements: **Node.js 20 or newer**. No database install needed.

```bash
npm install
cp .env.example .env.local      # optional for local dev; required before `npm start`
npm run db:setup                # creates tables + realistic demo data
npm run dev                     # open http://localhost:3000
```

The database also sets itself up automatically on the first request, so `db:setup` is optional. Run it (with `npm run dev` stopped) whenever you want to reset the demo data, or log in as admin and click **Reset demo data**.

### Demo accounts

| Role | Email | Password | Notes |
|---|---|---|---|
| Student | student@srmist.edu.in | Student@123 | 3rd year CSE, CGPA 8.4, has a pipeline already |
| Student | student2@srmist.edu.in | Student@123 | 2nd year ECE, for eligibility contrast |
| Trusted student | rahul@srmist.edu.in | Student@123 | Imports publish instantly (trusted contributor) |
| Admin | admin@srmist.edu.in | Admin@123 | Review queue, calendar, posting |

Demo dates are relative to the day you run `db:setup`, so there is always a Cycle Test starting in 9 days and upcoming deadlines.

### Tests

```bash
npm test     # 13 unit tests: parser, scam checker, clash detection, verdict, prep plan, dedup, moderation
```

---

## Features

### Everything the problem statement asks for
- Admin-entered opportunities (internships, hackathons, workshops, certifications, competitions, jobs, events)
- Browse, search and filter by **type, deadline and skill**
- **Bookmarks** and the status pipeline **Interested → Applied → Shortlisted → Completed**, with notes
- **Personal dashboard** with upcoming deadlines grouped by urgency and an application board

### What makes OppWise different
- **"Should I apply?" verdict** (Go for it / Tight / Skip): combines eligibility, skill match, exam clashes, days left and source trust, and always shows its reasons.
- **Smart Import:** paste a forward, **snap a poster** (OCR runs in the browser with Tesseract.js), or **share straight from WhatsApp** (installable PWA share target). Uncertain fields are highlighted for review.
- **Scam red flags with reasons:** registration fees, "guaranteed" placement, unrealistic earnings, personal Gmail as company contact, apply-by-DM, heavy urgency, shortened links only.
- **Duplicate merging:** the same forward shared by ten students becomes one listing ("shared by 10 students"), enforced by a `UNIQUE` database key.
- **Auto-moderation designed for a single admin:** admin posts and confident imports from trusted contributors publish instantly; junk is auto-rejected; risky or uncertain items go to a bulk-review queue; 3 student reports auto-hide a listing.
- **Exam-clash detection** against the academic calendar, plus a **month calendar** with exam weeks shaded.
- **Prep for this:** missing skills, free curated resources, and a day-by-day plan before the deadline that **skips exam days**. Marking a topic ready updates the match % and verdict live.
- **Register / Apply page:** clicking Register records the registration and moves the listing to *Applied* in the student's pipeline. Demo listings are fictional, so this in-app page always works in a live demo; real links still open the organiser's form.
- **Automatic sync from Unstop and Devfolio:** open hackathons, internships and competitions are pulled in once a day (Vercel Cron) and on the admin's **Sync now**. Each listing is mapped to our fields, scam-checked, merged with duplicates, marked "Live · Unstop/Devfolio" and linked back to the original page, where students register. Neither site has an official public API, so this reads the public listing JSON their own websites use, keeps only the basics, and falls back to a saved snapshot if a site can't be reached (`lib/sync.js`).
- **Calendar export** (`.ics`) for any deadline.
- **Reset demo data** (admin): rebuilds the demo with fresh dates, handy right before a presentation.

---

## Demo script (about 4 minutes)

1. **Log in as the student.** The feed shows verdicts on every card. Filter by "Go for it" or "Only eligible".
2. **Open "SDE Intern — Summer 2027".** Verdict: *Tight* (75% match, missing DBMS; deadline falls in Cycle Test 2).
3. **Prep for this → Show my prep plan.** Note the exam days skipped. Click **Mark as ready** on DBMS and the match jumps to 100%.
4. **Import → "hackathon forward" sample → Read it.** Every field is extracted. Submit it: as a new contributor it goes to review.
5. **Import → "suspicious forward" sample.** Scam check shows high risk with five reasons.
6. **Log in as Rahul** (trusted) and import the same hackathon forward: it publishes instantly. Import it again as the student: it merges ("shared by 2").
7. **Log in as admin → Admin.** Bulk-approve from the review queue; add an exam period and watch clash warnings appear in the feed.
8. **Calendar:** exam weeks shaded, deadlines and events plotted, clashes in amber.

**Poster demo:** on the Import page choose *Snap a poster* and photograph a printed poster (plain fonts, good light).
**WhatsApp demo (Android + Chrome, deployed over HTTPS):** open the site → browser menu → *Install app*. Then in WhatsApp long-press a message → Share → OppWise.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, installable PWA |
| Backend | Next.js API routes (REST), Zod validation shared with the frontend |
| Database | PostgreSQL. Locally: PGlite (real Postgres in-process, no install). Deployed: any hosted Postgres via `DATABASE_URL` |
| Auth | bcrypt password hashing, signed JWT in an httpOnly cookie, roles re-checked from the DB on every request |
| Parsing | Rule-based parser + chrono-node for dates; Tesseract.js OCR in the browser |

### Project structure

```
app/                 pages (feed, opportunities/[id], import, dashboard, calendar, profile, admin)
app/api/             REST endpoints (auth, opportunities, bookmark, report, ics, prep, import, admin/queue, calendar, me)
components/          UI components (cards, verdict badge, import form, prep panel, review queue, forms)
lib/                 business logic, framework-free and unit-tested:
  parser.js          Smart Import field extraction + confidence
  scam.js            scam red-flag rules with reasons
  dedup.js           duplicate keys
  moderation.js      auto-publish / review / reject rules
  eligibility.js     eligibility + skill match
  clash.js           exam-clash detection
  verdict.js         "Should I apply?" engine
  prep.js            exam-aware prep plan
  skills.js          shared skill dictionary (aliases, effort, free resources)
  validation.js      Zod schemas used by both browser and server
  opportunities.js   data access + the import pipeline
lib/schema.js        PostgreSQL schema with constraints
lib/seed.js          demo data (also used for auto-setup and the admin reset)
scripts/setup.js     resets the local database
tests/               node:test unit tests
```

### API overview

| Method | Endpoint | Who |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | anyone |
| GET | `/api/opportunities?q=&type=&skill=&within=&eligible=1&verdict=` | student |
| POST | `/api/opportunities` | admin |
| GET / PATCH / DELETE | `/api/opportunities/:id` | student / admin / admin |
| PUT / DELETE | `/api/opportunities/:id/bookmark` | student |
| POST | `/api/opportunities/:id/report` | student |
| GET | `/api/opportunities/:id/ics`, `/api/opportunities/:id/prep` | student |
| POST | `/api/import/preview`, `/api/import` | student |
| GET / PATCH | `/api/me`; POST `/api/me/skills` | student |
| GET / POST | `/api/admin/queue` | admin |
| GET / POST / DELETE | `/api/calendar`, `/api/calendar/:id` | student / admin / admin |

### Security and quality decisions
- **Server-side role checks** on every API route; the UI is never trusted.
- **Parameterised SQL everywhere** (no string-built queries), so no SQL injection.
- **One validation schema** (Zod) shared by forms and API, so rules can't drift apart.
- **Database constraints:** unique emails, one bookmark per student per opportunity, one report per student, unique duplicate keys, CHECK constraints on enums and dates.
- **Rate limiting** on login, registration and import.
- **Same error for wrong email or password** (no account enumeration).
- **Imported text is rendered as text** (React escapes it) and control characters are stripped; poster uploads are type- and size-checked.
- **httpOnly, SameSite cookies**; security headers (`nosniff`, `X-Frame-Options`, `Referrer-Policy`).
- Consistent JSON errors with field-level messages; loading, empty and error states on every page.

---

## Live site

https://oppwise-live.vercel.app (version 2, with automatic Unstop and Devfolio sync). Version 1 stays at https://oppwise-srm.vercel.app. Without a database attached it runs in **demo mode**: the data lives in memory and resets to the fresh demo whenever the server restarts after being idle. Attach Neon (step 3 below) to keep data permanently.

## Deploying so it's always online (Vercel + Neon, both free)

1. **Put the code on GitHub.** In the project folder:
   ```bash
   git init && git add . && git commit -m "OppWise"
   git branch -M main
   git remote add origin https://github.com/<your-username>/oppwise.git
   git push -u origin main
   ```
2. **Import the repo into Vercel** (Add New → Project → pick the repo → Deploy).
3. **Add a database:** in the Vercel project open **Storage → Create Database → Neon (free)** and connect it to the project. This sets `DATABASE_URL` automatically.
4. **Redeploy.** On the first request the app creates its tables and demo data by itself. No other settings are required; `SESSION_SECRET` is optional (if you don't set one, it is derived from the database URL, which is never exposed to browsers).

Every later `git push` to `main` redeploys automatically. HTTPS on Vercel also makes the app installable, which the WhatsApp share target needs.

## Known limitations (and what's next)
- The WhatsApp share target works on **Android** (Chrome) once installed; iPhone users paste instead.
- OCR accuracy depends on photo quality; uncertain fields are always highlighted for review.
- The rate limiter is in-memory (per server instance). A shared store (e.g. Redis) would be used at scale.
- Not yet built: automatic college-inbox sync (Gmail API), senior notes, peer signals, teammate finder, achievements export, weekly digest, placement-cell analytics.
