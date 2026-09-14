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
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS ninea TEXT NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS rc TEXT NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS rib TEXT NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS website TEXT NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS slogan TEXT NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS header_color TEXT NOT NULL DEFAULT '#1C2340'`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS footer_color TEXT NOT NULL DEFAULT '#2F4F9A'`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS logo_in_header BOOLEAN NOT NULL DEFAULT TRUE`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS logo_as_background BOOLEAN NOT NULL DEFAULT FALSE`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS header_name_align TEXT NOT NULL DEFAULT 'left'`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS logo_align TEXT NOT NULL DEFAULT 'left'`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS logo_scale INTEGER NOT NULL DEFAULT 1`);
  await query(`ALTER TABLE organismes ADD COLUMN IF NOT EXISTS show_header_doc_ref BOOLEAN NOT NULL DEFAULT TRUE`);
  // Adresse longue (au moins 200 caractères utiles) — TEXT n’impose pas de plafond.
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
