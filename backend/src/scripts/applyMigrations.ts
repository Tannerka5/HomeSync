import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");

config({ path: join(repoRoot, ".env") });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const migrationsDir = join(repoRoot, "db", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

async function main() {
  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    for (const f of files) {
      const sql = readFileSync(join(migrationsDir, f), "utf8");
      console.log("Applying", f);
      await client.query(sql);
    }
    console.log("Migrations applied.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
