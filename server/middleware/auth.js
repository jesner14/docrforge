import { query } from "../db.js";

const SESSION_COOKIE = "docforge_session";
const SESSION_DAYS = 14;

export { SESSION_COOKIE };

export async function getSessionUser(token) {
  if (!token) return null;
  const { rows } = await query(
    `SELECT u.*, o.name AS org_name, o.address AS org_address, o.email AS org_email,
            o.phone AS org_phone, o.logo AS org_logo, o.currency AS org_currency
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
    companyEmail: row.company_email || row.org_email || "",
    companyPhone: row.org_phone || row.company_phone || "",
    initials: row.initials,
    role: row.role,
  };
  if (row.org_logo) user.companyLogo = row.org_logo;
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
