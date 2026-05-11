import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/** Resolved from cwd so `npm run dev` / PM2 / Docker all find the same folder */
export function getMigrationsDirectory(): string {
  return path.join(process.cwd(), "migrations", "sql");
}

/**
 * Applies versioned `.sql` files from migrations/sql once each (tracked in schema_migrations).
 * Uses a dedicated connection with multipleStatements so migrations can contain several DDL statements.
 */
export async function runPendingSqlMigrations(opts?: {
  silent?: boolean;
}): Promise<string[]> {
  const log = opts?.silent ? () => undefined : console.log;
  const dir = getMigrationsDirectory();

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    timezone: "+00:00",
    multipleStatements: true,
  });

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(191) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    let files: string[];
    try {
      files = (await fs.readdir(dir))
        .filter((f) => f.endsWith(".sql"))
        .sort((a, b) => a.localeCompare(b));
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        log("[migrate] migrations/sql not found; skipping.");
        return [];
      }
      throw e;
    }

    const applied: string[] = [];

    for (const file of files) {
      const [done]: any = await conn.query(
        "SELECT version FROM schema_migrations WHERE version = ? LIMIT 1",
        [file]
      );
      if (done.length > 0) continue;

      const sqlPath = path.join(dir, file);
      const sql = await fs.readFile(sqlPath, "utf8");
      log(`[migrate] Applying ${file} …`);

      await conn.query(sql);
      await conn.query("INSERT INTO schema_migrations (version) VALUES (?)", [file]);

      applied.push(file);
    }

    if (applied.length && !opts?.silent) {
      log(`[migrate] Finished: ${applied.join(", ")}`);
    }
    return applied;
  } finally {
    await conn.end();
  }
}
