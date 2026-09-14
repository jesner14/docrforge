import bcrypt from "bcryptjs";
import { query, migrate, isSeeded } from "./db.js";
import { SEED_ORGANISMES, SEED_PROFILES, SEED_USERS } from "./seed-data.js";
import { ensureDefaultProfiles, ensureProfilesForAllOrganismes, migrateUsersToOrgProfiles } from "./profiles.js";

async function insertSeed() {
  for (const o of SEED_ORGANISMES) {
    await query(
      `INSERT INTO organismes (id, name, address, email, phone, logo, currency, ninea, rc, rib, website, slogan, header_color, footer_color, logo_in_header, logo_as_background, header_name_align, logo_align, logo_scale, show_header_doc_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         address = EXCLUDED.address,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         logo = EXCLUDED.logo,
         currency = EXCLUDED.currency,
         ninea = EXCLUDED.ninea,
         rc = EXCLUDED.rc,
         rib = EXCLUDED.rib,
         website = EXCLUDED.website,
         slogan = EXCLUDED.slogan,
         header_color = EXCLUDED.header_color,
         footer_color = EXCLUDED.footer_color,
         logo_in_header = EXCLUDED.logo_in_header,
         logo_as_background = EXCLUDED.logo_as_background,
         header_name_align = EXCLUDED.header_name_align,
         logo_align = EXCLUDED.logo_align,
         logo_scale = EXCLUDED.logo_scale,
         show_header_doc_ref = EXCLUDED.show_header_doc_ref`,
      [
        o.id,
        o.name,
        o.address,
        o.email,
        o.phone,
        o.logo,
        o.currency,
        o.ninea || "",
        o.rc || "",
        o.rib || "",
        o.website || "",
        o.slogan || "",
        o.headerColor || "#1C2340",
        o.footerColor || "#2F4F9A",
        o.logoInHeader !== false,
        !!o.logoAsBackground,
        o.headerNameAlign === "right" ? "right" : "left",
        o.logoAlign === "right" ? "right" : "left",
        o.logoScale === 2 || o.logoScale === 3 || o.logoScale === 4 ? o.logoScale : 1,
        o.showHeaderDocRef !== false,
      ]
    );
  }

  await ensureDefaultProfiles(SEED_ORGANISMES[0].id);

  for (const p of SEED_PROFILES) {
    await query(
      `INSERT INTO profiles (id, label, screen_ids, organisme_id) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         label = EXCLUDED.label,
         screen_ids = EXCLUDED.screen_ids,
         organisme_id = EXCLUDED.organisme_id`,
      [p.id, p.label, JSON.stringify(p.screenIds), p.organismeId]
    );
  }

  for (const u of SEED_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await query(
      `INSERT INTO users (
        id, login, password_hash, name, profile_id, organisme_id,
        title, company_email, company_phone, initials, role
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET
        login = EXCLUDED.login,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        profile_id = EXCLUDED.profile_id,
        organisme_id = EXCLUDED.organisme_id,
        title = EXCLUDED.title,
        company_email = EXCLUDED.company_email,
        initials = EXCLUDED.initials,
        role = EXCLUDED.role`,
      [
        u.id,
        u.login.toLowerCase(),
        hash,
        u.name,
        u.profileId,
        u.organismeId,
        u.title,
        u.companyEmail || "",
        "",
        u.initials,
        u.role,
      ]
    );
  }
}

export async function seedDatabase() {
  await migrate();
  await ensureProfilesForAllOrganismes();
  await migrateUsersToOrgProfiles();
  if (await isSeeded()) return false;
  await insertSeed();
  console.log("Base initialisée — superadmin jesner.landa créé.");
  return true;
}

export async function resetDatabase() {
  await migrate();
  await query(`
    TRUNCATE TABLE
      sessions,
      documents,
      custom_templates,
      expense_months,
      rental_months,
      users,
      profiles,
      organismes
    RESTART IDENTITY CASCADE
  `);
  await insertSeed();
  await ensureProfilesForAllOrganismes();
  console.log("Base réinitialisée — superadmin jesner.landa créé.");
}

if (process.argv[1]?.endsWith("seed.js")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
