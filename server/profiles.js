import { query } from "./db.js";
import { DEFAULT_PROFILE_TEMPLATES, ORG_SYSTEM, profileIdForOrg, SEED_PROFILES } from "./seed-data.js";

function rowToProfile(row) {
  return {
    id: row.id,
    label: row.label,
    screenIds: row.screen_ids || [],
    organismeId: row.organisme_id,
  };
}

export async function loadProfiles(orgFilter = null) {
  const params = [];
  let sql = `SELECT * FROM profiles`;
  if (orgFilter) {
    sql += ` WHERE organisme_id = $1`;
    params.push(orgFilter);
  }
  sql += ` ORDER BY label`;
  const { rows } = await query(sql, params);
  return rows.map(rowToProfile);
}

export async function ensureDefaultProfiles(orgId) {
  if (orgId === ORG_SYSTEM) {
    for (const p of SEED_PROFILES) {
      await query(
        `INSERT INTO profiles (id, label, screen_ids, organisme_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           label = EXCLUDED.label,
           screen_ids = EXCLUDED.screen_ids,
           organisme_id = EXCLUDED.organisme_id`,
        [p.id, p.label, JSON.stringify(p.screenIds || []), ORG_SYSTEM]
      );
    }
    return;
  }

  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM profiles WHERE organisme_id = $1`, [orgId]);
  if (rows[0].n > 0) return;

  for (const tpl of DEFAULT_PROFILE_TEMPLATES) {
    await query(
      `INSERT INTO profiles (id, label, screen_ids, organisme_id) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [profileIdForOrg(orgId, tpl.slug), tpl.label, JSON.stringify(tpl.screenIds || []), orgId]
    );
  }
}

export async function ensureProfilesForAllOrganismes() {
  const { rows } = await query(`SELECT id FROM organismes ORDER BY id`);
  for (const row of rows) {
    await ensureDefaultProfiles(row.id);
  }
}

export async function migrateUsersToOrgProfiles() {
  const { rows: orgs } = await query(`SELECT id FROM organismes WHERE id <> $1`, [ORG_SYSTEM]);
  const legacy = {
    "p-facturation": "facturation",
    "p-administration": "administration",
    "p-rh": "rh",
    "p-assistante": "assistante",
  };
  for (const org of orgs) {
    for (const [legacyId, slug] of Object.entries(legacy)) {
      const newId = profileIdForOrg(org.id, slug);
      await query(`UPDATE users SET profile_id = $1 WHERE organisme_id = $2 AND profile_id = $3`, [
        newId,
        org.id,
        legacyId,
      ]);
    }
  }
}
