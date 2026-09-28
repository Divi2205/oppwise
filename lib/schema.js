// PostgreSQL schema. Kept as JS so it ships with the app and can auto-create tables on first run.
export const DROP_SQL = `
DROP TABLE IF EXISTS sync_runs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS users;
`;

export const SCHEMA_SQL = `CREATE TABLE sync_runs (
  id       SERIAL PRIMARY KEY,
  source   TEXT NOT NULL,                     -- unstop | devfolio
  mode     TEXT NOT NULL,                     -- live | snapshot
  fetched  INT NOT NULL DEFAULT 0,
  added    INT NOT NULL DEFAULT 0,
  updated  INT NOT NULL DEFAULT 0,
  error    TEXT,
  ran_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  year            INT CHECK (year BETWEEN 1 AND 5),
  branch          TEXT,
  cgpa            REAL CHECK (cgpa >= 0 AND cgpa <= 10),
  skills          JSONB NOT NULL DEFAULT '[]',
  approved_count  INT NOT NULL DEFAULT 0,   -- submissions approved (trusted-contributor rule)
  rejected_count  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE opportunities (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  org               TEXT,
  type              TEXT NOT NULL CHECK (type IN ('internship','hackathon','workshop','certification','competition','job','event')),
  description       TEXT NOT NULL DEFAULT '',
  link              TEXT,
  deadline          DATE,
  event_start       DATE,
  event_end         DATE,
  mode              TEXT CHECK (mode IN ('online','offline','hybrid')),
  reward            TEXT,
  eligible_years    JSONB NOT NULL DEFAULT '[]',   -- [] = all years
  eligible_branches JSONB NOT NULL DEFAULT '[]',   -- [] = all branches
  min_cgpa          REAL,
  skills            JSONB NOT NULL DEFAULT '[]',
  source            TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin','paste','share','poster','email','unstop','devfolio')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('published','pending','rejected','archived')),
  scam_level        TEXT NOT NULL DEFAULT 'none' CHECK (scam_level IN ('none','low','medium','high')),
  scam_flags        JSONB NOT NULL DEFAULT '[]',
  confidence        JSONB NOT NULL DEFAULT '{}',
  review_reasons    JSONB NOT NULL DEFAULT '[]',
  dedup_key         TEXT UNIQUE,                   -- DB-level guarantee against duplicate listings
  dup_count         INT NOT NULL DEFAULT 1,
  report_count      INT NOT NULL DEFAULT 0,
  submitted_by      INT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_opp_status_deadline ON opportunities (status, deadline);

CREATE TABLE bookmarks (
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opp_id      INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested','applied','shortlisted','completed')),
  note        TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opp_id)                     -- one bookmark per student per opportunity
);

CREATE TABLE reports (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opp_id     INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opp_id)                     -- one report per student per opportunity
);

CREATE TABLE calendar_events (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('exam','holiday')),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  CHECK (end_date >= start_date)
);
`;

// Splits into single statements (PGlite's query() runs one statement at a time).
export function statements(sql) {
  return sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((x) => x.trim())
    .filter(Boolean);
}

// Idempotent upgrades for databases created by an earlier version (safe to run on every start).
export const MIGRATIONS_SQL = `
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_source_check;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_source_check CHECK (source IN ('admin','paste','share','poster','email','unstop','devfolio'));
CREATE TABLE IF NOT EXISTS sync_runs (id SERIAL PRIMARY KEY, source TEXT NOT NULL, mode TEXT NOT NULL, fetched INT NOT NULL DEFAULT 0, added INT NOT NULL DEFAULT 0, updated INT NOT NULL DEFAULT 0, error TEXT, ran_at TIMESTAMPTZ NOT NULL DEFAULT now());
`;
