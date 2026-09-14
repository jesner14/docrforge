import { query } from "../db.js";

const SESSION_COOKIE = "docforge_session";
const SESSION_DAYS = 14;

export { SESSION_COOKIE };

export async function getSessionUser(token) {
  if (!token) return null;
  const { rows } = await query(
    `SELECT u.*, o.name AS org_name, o.address AS org_address, o.email AS org_email,
            o.phone AS org_phone, o.logo AS org_logo, o.currency AS org_currency,
            o.ninea AS org_ninea, o.rc AS org_rc, o.rib AS org_rib, o.website AS org_website,
            o.slogan AS org_slogan,
            o.header_color AS org_header_color, o.footer_color AS org_footer_color,
            o.logo_in_header AS org_logo_in_header, o.logo_as_background AS org_logo_as_background,
            o.header_name_align AS org_header_name_align, o.logo_align AS org_logo_align,
            o.logo_scale AS org_logo_scale,
            o.show_header_doc_ref AS org_show_header_doc_ref
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN organismes o ON o.id = u.organisme_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

export function rowToUser(row, { includePassword = false } = {}) {
  if (!row) return null;
  const user = {
    id: row.id,
    login: row.login,
    name: row.name,
    profileId: row.profile_id,
    organismeId: row.organisme_id,
    title: row.title,
    company: row.org_name || "",
    companyAddress: row.org_address || "",
    companyEmail: (() => {
      const clean = (e) => {
        const s = String(e || "").trim();
        return s.endsWith(".local") ? "" : s;
      };
      return clean(row.org_email) || clean(row.company_email);
    })(),
    companyPhone: row.org_phone || row.company_phone || "",
    initials: row.initials,
    role: row.role,
  };
  if (row.org_logo) user.companyLogo = row.org_logo;
  if (row.org_ninea) user.companyNinea = row.org_ninea;
  if (row.org_rc) user.companyRc = row.org_rc;
  if (row.org_rib) user.companyRib = row.org_rib;
  if (row.org_website) user.companyWebsite = row.org_website;
  user.companySlogan = row.org_slogan || "";
  user.companyHeaderColor = row.org_header_color || "#1C2340";
  user.companyFooterColor = row.org_footer_color || "#2F4F9A";
  user.companyLogoInHeader = row.org_logo_in_header !== false;
  user.companyLogoAsBackground = !!row.org_logo_as_background;
  user.companyHeaderNameAlign = row.org_header_name_align === "right" ? "right" : "left";
  user.companyLogoAlign = row.org_logo_align === "right" ? "right" : "left";
  user.companyLogoScale =
    row.org_logo_scale === 2 || row.org_logo_scale === 3 || row.org_logo_scale === 4 ? row.org_logo_scale : 1;
  user.companyShowHeaderDocRef = row.org_show_header_doc_ref !== false;
  if (includePassword) user.password = row.password_plain || "********";
  else user.password = "********";
  return user;
}

export async function createSession(userId) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`, [
    token,
    userId,
    expires.toISOString(),
  ]);
  return { token, expires };
}

export async function deleteSession(token) {
  if (!token) return;
  await query(`DELETE FROM sessions WHERE token = $1`, [token]);
}

export function requireAuth() {
  return async (req, res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    const row = await getSessionUser(token);
    if (!row) {
      return res.status(401).json({ error: "Non authentifié." });
    }
    req.authUser = rowToUser(row);
    req.authRow = row;
    req.sessionToken = token;
    next();
  };
}

export function isAdmin(user) {
  return user?.profileId === "p-superadmin" || user?.profileId === "p-admin";
}

export function isSuperAdmin(user) {
  return user?.profileId === "p-superadmin";
}
