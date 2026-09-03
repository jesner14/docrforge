import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ORG_SYSTEM } from "./seed-data.js";

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
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organisme_id TEXT REFERENCES organismes(id) ON DELETE CASCADE`);
  await query(`CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organisme_id)`);
  await query(`UPDATE profiles SET organisme_id = $1 WHERE id = 'p-superadmin' AND organisme_id IS NULL`, [ORG_SYSTEM]);
  await query(`UPDATE profiles SET organisme_id = $1 WHERE organisme_id IS NULL AND id <> 'p-superadmin'`, [ORG_SYSTEM]);
  // Ajoute l'écran « locations » aux profils assistante / superadmin existants
  await query(`
    UPDATE profiles
    SET screen_ids = screen_ids || '["locations"]'::jsonb
    WHERE NOT (screen_ids ? 'locations')
      AND (
        id = 'p-superadmin'
        OR id LIKE '%assistante'
        OR id LIKE '%--assistante'
        OR lower(label) LIKE '%assistante%'
      )
  `);
}

export async function isSeeded() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM users");
  return rows[0].n > 0;
}
