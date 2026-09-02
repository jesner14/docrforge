import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://docforge:docforge@localhost:5432/docforge",
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await query(schema);
}

export async function isSeeded() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM users");
  return rows[0].n > 0;
}
