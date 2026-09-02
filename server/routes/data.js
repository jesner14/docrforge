import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { isAdmin, requireAuth, rowToUser } from "../middleware/auth.js";
import { ORG_SYSTEM } from "../seed-data.js";

function rowToOrganisme(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    email: row.email,
    phone: row.phone,
    logo: row.logo,
    currency: row.currency,
  };
}

function rowToProfile(row) {
  return {
    id: row.id,
    label: row.label,
    screenIds: row.screen_ids || [],
  };
}

function rowToDocument(row) {
  const payload = row.payload || {};
  return {
    ...payload,
    id: row.id,
    organismeId: row.organisme_id,
    authorId: payload.authorId || row.author_id,
  };
}

function rowToTemplate(row) {
  const payload = row.payload || {};
  return {
    ...payload,
    id: row.id,
    organismeId: row.organisme_id,
  };
}

function rowToExpenseMonth(row) {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    sealed: row.sealed,
    sealedAt: row.sealed_at || undefined,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    organismeId: row.organisme_id,
    lines: row.lines || [],
  };
}

async function loadOrganismes() {
  const { rows } = await query(`SELECT * FROM organismes ORDER BY name`);
  return rows.map(rowToOrganisme);
}

async function loadProfiles() {
  const { rows } = await query(`SELECT * FROM profiles ORDER BY label`);
  return rows.map(rowToProfile);
}

async function loadUsers(includePasswords) {
  const { rows } = await query(
    `SELECT u.*, o.name AS org_name, o.address AS org_address, o.email AS org_email,
            o.phone AS org_phone, o.logo AS org_logo, o.currency AS org_currency
     FROM users u
     JOIN organismes o ON o.id = u.organisme_id
     ORDER BY u.name`
  );
  return rows.map((r) => rowToUser(r, { includePassword: includePasswords }));
}

async function loadDocuments(orgFilter) {
  const params = [];
  let sql = `SELECT d.*, d.payload->>'authorId' AS author_id FROM documents d`;
  if (orgFilter) {
    sql += ` WHERE d.organisme_id = $1`;
    params.push(orgFilter);
  }
  sql += ` ORDER BY d.id DESC`;
  const { rows } = await query(sql, params);
  return rows.map(rowToDocument);
}

async function loadTemplates(orgFilter) {
  const params = [];
  let sql = `SELECT * FROM custom_templates`;
  if (orgFilter) {
    sql += ` WHERE organisme_id = $1`;
    params.push(orgFilter);
  }
  sql += ` ORDER BY id`;
  const { rows } = await query(sql, params);
  return rows.map(rowToTemplate);
}

async function loadExpenseMonths(orgFilter) {
  const params = [];
  let sql = `SELECT * FROM expense_months`;
  if (orgFilter) {
    sql += ` WHERE organisme_id = $1`;
    params.push(orgFilter);
  }
  sql += ` ORDER BY year DESC, month DESC`;
  const { rows } = await query(sql, params);
  return rows.map(rowToExpenseMonth);
}

export function registerDataRoutes(app) {
  app.get("/api/bootstrap", requireAuth(), async (req, res) => {
    try {
      const admin = isAdmin(req.authUser);
      const orgFilter = admin ? null : req.authUser.organismeId;

      const [organismes, profiles, users, documents, templates, expenseMonths] = await Promise.all([
        admin ? loadOrganismes() : loadOrganismes().then((all) => all.filter((o) => o.id === orgFilter)),
        loadProfiles(),
        loadUsers(admin),
        loadDocuments(orgFilter),
        loadTemplates(orgFilter),
        loadExpenseMonths(orgFilter),
      ]);

      res.json({
        user: req.authUser,
        organismes,
        profiles,
        users,
        documents,
        templates,
        expenseMonths,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Impossible de charger les données." });
    }
  });

  app.put("/api/organismes", requireAuth(), async (req, res) => {
    try {
      const admin = isAdmin(req.authUser);
      let organismes = req.body?.organismes || [];

      if (!admin) {
        const orgId = req.authUser.organismeId;
        organismes = organismes.filter((o) => o.id === orgId);
        if (!organismes.length) return res.status(403).json({ error: "Accès refusé." });
      }

      await query("BEGIN");
      if (admin) {
        const ids = [...new Set([...organismes.map((o) => o.id), ORG_SYSTEM])];
        await query(`DELETE FROM organismes WHERE id <> $1 AND NOT (id = ANY($2::text[]))`, [ORG_SYSTEM, ids]);
      }
      for (const o of organismes) {
        await query(
          `INSERT INTO organismes (id, name, address, email, phone, logo, currency)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             address = EXCLUDED.address,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             logo = EXCLUDED.logo,
             currency = EXCLUDED.currency`,
          [o.id, o.name, o.address, o.email || "", o.phone || "", o.logo || "", o.currency || "EUR"]
        );
      }
      await query("COMMIT");
      res.json({ organismes: await loadOrganismes() });
    } catch (err) {
      await query("ROLLBACK").catch(() => {});
      console.error(err);
      res.status(500).json({ error: "Enregistrement impossible." });
    }
  });

  app.put("/api/profiles", requireAuth(), async (req, res) => {
    try {
      if (!isAdmin(req.authUser)) return res.status(403).json({ error: "Accès refusé." });
      const profiles = req.body?.profiles || [];
      await query("BEGIN");
      const ids = profiles.map((p) => p.id);
      if (ids.length) {
        await query(`DELETE FROM profiles WHERE NOT (id = ANY($1::text[]))`, [ids]);
      } else {
        await query(`DELETE FROM profiles`);
      }
      for (const p of profiles) {
        await query(
          `INSERT INTO profiles (id, label, screen_ids) VALUES ($1,$2,$3)
           ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, screen_ids = EXCLUDED.screen_ids`,
          [p.id, p.label, JSON.stringify(p.screenIds || [])]
        );
      }
      await query("COMMIT");
      res.json({ profiles: await loadProfiles() });
    } catch (err) {
      await query("ROLLBACK").catch(() => {});
      console.error(err);
      res.status(500).json({ error: "Enregistrement impossible." });
    }
  });

  app.put("/api/users", requireAuth(), async (req, res) => {
    try {
      if (!isAdmin(req.authUser)) return res.status(403).json({ error: "Accès refusé." });
      const users = req.body?.users || [];
      const { rows: existingRows } = await query(`SELECT id, password_hash FROM users`);
      const hashById = new Map(existingRows.map((r) => [r.id, r.password_hash]));

      await query("BEGIN");
      const ids = users.map((u) => u.id);
      if (ids.length) {
        await query(`DELETE FROM users WHERE NOT (id = ANY($1::text[]))`, [ids]);
      }

      for (const u of users) {
        let hash = hashById.get(u.id);
        const pwd = String(u.password || "");
        const PLACEHOLDER = "********";
        if (pwd && pwd !== PLACEHOLDER) {
          hash = await bcrypt.hash(pwd, 10);
        } else if (!hash) {
          return res.status(400).json({ error: `Mot de passe manquant pour ${u.login}.` });
        }

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
            company_phone = EXCLUDED.company_phone,
            initials = EXCLUDED.initials,
            role = EXCLUDED.role`,
          [
            u.id,
            u.login.toLowerCase(),
            hash,
            u.name,
            u.profileId,
            u.organismeId,
            u.title || "",
            u.companyEmail || "",
            u.companyPhone || "",
            u.initials || "",
            u.role || "facturation",
          ]
        );
      }
      await query("COMMIT");
      res.json({ users: await loadUsers(true) });
    } catch (err) {
      await query("ROLLBACK").catch(() => {});
      console.error(err);
      res.status(500).json({ error: "Enregistrement impossible." });
    }
  });

  app.put("/api/documents", requireAuth(), async (req, res) => {
    try {
      const documents = req.body?.documents || [];
      const orgId = req.authUser.organismeId;
      const admin = isAdmin(req.authUser);

      await query("BEGIN");
      if (admin) {
        const ids = documents.map((d) => d.id);
        if (ids.length) {
          await query(`DELETE FROM documents WHERE NOT (id = ANY($1::text[]))`, [ids]);
        } else {
          await query(`DELETE FROM documents`);
        }
      } else {
        await query(`DELETE FROM documents WHERE organisme_id = $1`, [orgId]);
      }

      for (const d of documents) {
        const docOrg = admin ? d.organismeId || orgId : orgId;
        if (!admin && docOrg !== orgId) continue;
        const { id, organismeId, authorId, ...rest } = d;
        const payload = { ...rest, authorId: authorId || d.authorId };
        await query(
          `INSERT INTO documents (id, organisme_id, author_id, payload) VALUES ($1,$2,$3,$4)
           ON CONFLICT (id) DO UPDATE SET organisme_id = EXCLUDED.organisme_id, author_id = EXCLUDED.author_id, payload = EXCLUDED.payload`,
          [id, docOrg, payload.authorId, JSON.stringify(payload)]
        );
      }
      await query("COMMIT");
      res.json({ documents: await loadDocuments(admin ? null : orgId) });
    } catch (err) {
      await query("ROLLBACK").catch(() => {});
      console.error(err);
      res.status(500).json({ error: "Enregistrement impossible." });
    }
  });

  app.put("/api/templates", requireAuth(), async (req, res) => {
    try {
      const templates = req.body?.templates || [];
      const orgId = req.authUser.organismeId;
      const admin = isAdmin(req.authUser);

      await query("BEGIN");
      if (admin) {
        const ids = templates.map((t) => t.id);
        if (ids.length) {
          await query(`DELETE FROM custom_templates WHERE NOT (id = ANY($1::text[]))`, [ids]);
        } else {
          await query(`DELETE FROM custom_templates`);
        }
      } else {
        await query(`DELETE FROM custom_templates WHERE organisme_id = $1`, [orgId]);
      }

      for (const t of templates) {
        const tplOrg = admin ? t.organismeId || orgId : orgId;
        if (!admin && tplOrg !== orgId) continue;
        const { id, organismeId, ...payload } = t;
        await query(
          `INSERT INTO custom_templates (id, organisme_id, payload) VALUES ($1,$2,$3)
           ON CONFLICT (id) DO UPDATE SET organisme_id = EXCLUDED.organisme_id, payload = EXCLUDED.payload`,
          [id, tplOrg, JSON.stringify({ ...payload, id, organismeId: tplOrg })]
        );
      }
      await query("COMMIT");
      res.json({ templates: await loadTemplates(admin ? null : orgId) });
    } catch (err) {
      await query("ROLLBACK").catch(() => {});
      console.error(err);
      res.status(500).json({ error: "Enregistrement impossible." });
    }
  });

  app.put("/api/expenses", requireAuth(), async (req, res) => {
    try {
      const months = req.body?.months || [];
      const orgId = req.authUser.organismeId;
      const admin = isAdmin(req.authUser);

      await query("BEGIN");
      if (admin) {
        const ids = months.map((m) => m.id);
        if (ids.length) {
          await query(`DELETE FROM expense_months WHERE NOT (id = ANY($1::text[]))`, [ids]);
        } else {
          await query(`DELETE FROM expense_months`);
        }
      } else {
        await query(`DELETE FROM expense_months WHERE organisme_id = $1`, [orgId]);
      }

      for (const m of months) {
        const mOrg = admin ? m.organismeId || orgId : orgId;
        if (!admin && mOrg !== orgId) continue;
        await query(
          `INSERT INTO expense_months (id, organisme_id, year, month, sealed, sealed_at, updated_at, lines)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             organisme_id = EXCLUDED.organisme_id,
             year = EXCLUDED.year,
             month = EXCLUDED.month,
             sealed = EXCLUDED.sealed,
             sealed_at = EXCLUDED.sealed_at,
             updated_at = EXCLUDED.updated_at,
             lines = EXCLUDED.lines`,
          [
            m.id,
            mOrg,
            m.year,
            m.month,
            !!m.sealed,
            m.sealedAt || null,
            m.updatedAt || new Date().toISOString(),
            JSON.stringify(m.lines || []),
          ]
        );
      }
      await query("COMMIT");
      res.json({ expenseMonths: await loadExpenseMonths(admin ? null : orgId) });
    } catch (err) {
      await query("ROLLBACK").catch(() => {});
      console.error(err);
      res.status(500).json({ error: "Enregistrement impossible." });
    }
  });
}
