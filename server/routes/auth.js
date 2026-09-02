import bcrypt from "bcryptjs";
import { query } from "../db.js";
import {
  SESSION_COOKIE,
  createSession,
  deleteSession,
  getSessionUser,
  requireAuth,
  rowToUser,
} from "../middleware/auth.js";

export function registerAuthRoutes(app) {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const login = String(req.body?.login || "")
        .trim()
        .toLowerCase();
      const password = String(req.body?.password || "");
      if (!login || !password) {
        return res.status(400).json({ error: "Identifiant et mot de passe requis." });
      }

      const { rows } = await query(
        `SELECT u.*, o.name AS org_name, o.address AS org_address, o.email AS org_email,
                o.phone AS org_phone, o.logo AS org_logo, o.currency AS org_currency
         FROM users u
         JOIN organismes o ON o.id = u.organisme_id
         WHERE LOWER(u.login) = $1`,
        [login]
      );
      const row = rows[0];
      if (!row) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

      const { token, expires } = await createSession(row.id);
      res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires,
        path: "/",
      });

      res.json({ user: rowToUser(row) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    await deleteSession(token);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    const row = await getSessionUser(token);
    if (!row) return res.status(401).json({ error: "Non authentifié." });
    res.json({ user: rowToUser(row) });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "docforge-api" });
  });
}

export { requireAuth };
