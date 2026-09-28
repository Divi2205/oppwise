// Database adapter.
// - No DATABASE_URL  -> PGlite: a real PostgreSQL engine running locally (data in ./.pglite).
// - DATABASE_URL set -> node-postgres Pool (e.g. Neon via Vercel, Supabase, any hosted PostgreSQL).
// Both expose query(text, params) -> { rows }, so the rest of the app only ever writes
// parameterised SQL ($1, $2 ...) and never concatenates user input into queries.
//
// On first use, if the tables don't exist yet, the schema and demo data are created
// automatically, so a fresh deployment works with no manual setup step.

const g = globalThis;

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

async function tablesExist(c) {
  const r = await c.query("SELECT to_regclass('public.users') IS NOT NULL AS ok");
  return r.rows[0].ok === true;
}

// Brings an older database up to date (new columns, constraints, tables).
async function migrate(c) {
  const { MIGRATIONS_SQL, statements } = await import("./schema.js");
  for (const stmt of statements(MIGRATIONS_SQL)) await c.query(stmt);
}

async function createClient() {
  const url = databaseUrl();
  if (url) {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_MAX) || 5,
    });
    const client = { query: (text, params) => pool.query(text, params), close: () => pool.end() };
    if (process.env.OPPWISE_SKIP_INIT !== "1") {
      // An advisory lock stops two serverless instances from initialising at the same time.
      const conn = await pool.connect();
      try {
        await conn.query("SELECT pg_advisory_lock(727272)");
        if (!(await tablesExist(conn))) {
          const { initDatabase } = await import("./seed.js");
          await initDatabase({ query: (t, p) => conn.query(t, p) });
        } else {
          await migrate({ query: (t, p) => conn.query(t, p) });
        }
      } finally {
        await conn.query("SELECT pg_advisory_unlock(727272)").catch(() => {});
        conn.release();
      }
    }
    return client;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  // On serverless hosting without DATABASE_URL, run the database in memory (demo mode:
// data resets to the fresh demo when the server instance restarts).
  const dir = process.env.PGLITE_DIR || (process.env.VERCEL ? "memory://" : "./.pglite");
  const db = new PGlite(dir);
  await db.waitReady;
  const client = { query: (text, params) => db.query(text, params), close: () => db.close() };
  if (process.env.OPPWISE_SKIP_INIT !== "1") {
    if (!(await tablesExist(client))) {
      const { initDatabase } = await import("./seed.js");
      await initDatabase(client);
    } else {
      await migrate(client);
    }
  }
  return client;
}

export async function getDb() {
  // Reuse one client per server process (and across hot reloads in development).
  if (!g.__oppwiseDb) {
    g.__oppwiseDb = createClient().catch((err) => {
      g.__oppwiseDb = null; // allow a retry on the next request
      throw err;
    });
  }
  return g.__oppwiseDb;
}

export async function query(text, params = []) {
  const db = await getDb();
  const res = await db.query(text, params);
  return res.rows;
}

export async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}
