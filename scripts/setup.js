// Resets the database and loads demo data.  Run with:  npm run db:setup
import { readFileSync, existsSync } from "node:fs";

// Load .env / .env.local if present (Next.js does this for the app itself).
for (const f of [".env", ".env.local"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
process.env.OPPWISE_SKIP_INIT = "1";

const { getDb } = await import("../lib/db.js");
const { initDatabase } = await import("../lib/seed.js");
const db = await getDb();
console.log(process.env.DATABASE_URL || process.env.POSTGRES_URL ? "Using PostgreSQL from DATABASE_URL" : "Using local PGlite database in ./.pglite");
await initDatabase(db, { reset: true });
console.log(`\n✓ Tables created and demo data loaded.
Demo accounts:
  Admin    admin@srmist.edu.in     / Admin@123
  Student  student@srmist.edu.in   / Student@123   (3rd year CSE)
  Student  student2@srmist.edu.in  / Student@123   (2nd year ECE)
  Trusted  rahul@srmist.edu.in     / Student@123   (auto-publishes)
`);
await db.close();
