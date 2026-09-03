import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Organisme, Profile, User } from "../lib/types";
import { applyOrganisme, findOrganisme, initialsFrom, newUser, profileIdForOrg, profilesForOrganisme, syncUserRole, ORG_SYSTEM } from "../lib/access";
import { inp, lbl } from "../lib/helpers";

export function UsersPage({
  users,
  profiles,
  organismes,
  canPickOrganisme,
  defaultOrganismeId,
  onChange,
}: {
  users: User[];
  profiles: Profile[];
  organismes: Organisme[];
  canPickOrganisme: boolean;
  defaultOrganismeId: string;
  onChange: (next: User[]) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState("");
  const customerOrganismes = organismes.filter((o) => o.id !== ORG_SYSTEM);

  const profilesForUser = (organismeId: string) => profilesForOrganisme(profiles, organismeId);

  const defaultProfileForOrg = (organismeId: string) => {
    const list = profilesForUser(organismeId);
    return list.find((p) => p.id === profileIdForOrg(organismeId, "facturation")) ?? list[0];
  };

  const save = async () => {
    if (!editing) return;
    const isNew = !users.some((u) => u.id === editing.id);
    if (!editing.name.trim() || !editing.login.trim() || !editing.profileId || !editing.organismeId) {
      setError("Nom, identifiant, profil et organisme sont obligatoires.");
      return;
    }
    if (isNew && !editing.password.trim()) {
      setError("Mot de passe obligatoire pour un nouvel utilisateur.");
      return;
    }
    const login = editing.login.trim().toLowerCase();
    if (users.some((u) => u.id !== editing.id && u.login.toLowerCase() === login)) {
      setError("Cet identifiant existe déjà.");
      return;
    }
    const org = findOrganisme(organismes, editing.organismeId);
    const password =
      isNew || editing.password.trim()
        ? editing.password
        : "********";
    const clean = syncUserRole(
      applyOrganisme(
        {
          ...editing,
          login,
          password,
          name: editing.name.trim(),
          initials: editing.initials || initialsFrom(editing.name),
          companyEmail: editing.companyEmail || `${login}@${org?.name.toLowerCase().replace(/\s+/g, "-") || "organisme"}.local`,
        },
        org
      ),
      profiles
    );
    const exists = users.some((u) => u.id === clean.id);
    const next = exists ? users.map((u) => (u.id === clean.id ? clean : u)) : [clean, ...users];
    try {
      await onChange(next);
      setEditing(null);
      setError("");
    } catch {
      setError("Enregistrement impossible. Vérifiez que l'API est démarrée.");
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "#1C2340" }}>
              Utilisateurs
            </h1>
            <p style={{ color: "#999", fontSize: "0.88rem", marginTop: 5 }}>
              Chaque utilisateur appartient à un organisme et ne voit que les données de celui-ci.
            </p>
          </div>
          <button
            onClick={() => {
              setError("");
              const org = findOrganisme(organismes, defaultOrganismeId) ?? customerOrganismes[0];
              const defaultProfile = org ? defaultProfileForOrg(org.id) : undefined;
              setEditing(newUser(defaultProfile?.id || "", org?.id || defaultOrganismeId, org ?? undefined));
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#B8923A" }}
          >
            <Plus size={15} />
            Nouvel utilisateur
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(28,35,64,0.06)" }}>
                {["Utilisateur", "Identifiant", "Profil", "Organisme", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3"
                    style={{ fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#bbb" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const p = profiles.find((x) => x.id === u.profileId);
                const org = organismes.find((o) => o.id === u.organismeId);
                return (
                  <tr
                    key={u.id}
                    style={{ borderBottom: i < users.length - 1 ? "1px solid rgba(28,35,64,0.04)" : "none" }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                          style={{ background: "#1C2340" }}
                        >
                          {u.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: "#1C2340" }}>
                            {u.name}
                          </div>
                          <div className="text-xs" style={{ color: "#999" }}>
                            {u.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ fontFamily: "'DM Mono', monospace", color: "#555" }}>
                      {u.login}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(184,146,58,0.15)", color: "#8a6b20" }}>
                        {p?.label || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>
                      {org?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setError("");
                          setEditing({ ...u, password: "" });
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      {users.length > 1 && (
                        <button
                          className="p-1.5 text-muted-foreground hover:text-destructive"
                          onClick={() => onChange(users.filter((x) => x.id !== u.id))}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,35,64,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1C2340", fontSize: "1.2rem" }}>
              {users.some((u) => u.id === editing.id) ? "Modifier l’utilisateur" : "Nouvel utilisateur"}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className={lbl}>Nom</label>
                <input className={inp} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Fonction</label>
                <input className={inp} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Identifiant (login)</label>
                <input className={inp} value={editing.login} onChange={(e) => setEditing({ ...editing, login: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Mot de passe</label>
                <input
                  className={inp}
                  type="password"
                  autoComplete="new-password"
                  placeholder={users.some((u) => u.id === editing.id) ? "Laisser vide pour conserver l'actuel" : "Mot de passe de connexion"}
                  value={editing.password ?? ""}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                />
              </div>
              <div>
                <label className={lbl}>Profil</label>
                <select
                  className={inp}
                  value={editing.profileId}
                  onChange={(e) => setEditing({ ...editing, profileId: e.target.value })}
                >
                  {profilesForUser(editing.organismeId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Organisme</label>
                <select
                  className={inp}
                  value={editing.organismeId}
                  disabled={!canPickOrganisme}
                  onChange={(e) => {
                    const org = findOrganisme(organismes, e.target.value);
                    const nextOrgId = e.target.value;
                    const nextProfile = defaultProfileForOrg(nextOrgId);
                    setEditing(
                      org
                        ? applyOrganisme(
                            { ...editing, organismeId: nextOrgId, profileId: nextProfile?.id || editing.profileId },
                            org
                          )
                        : { ...editing, organismeId: nextOrgId, profileId: nextProfile?.id || editing.profileId }
                    );
                  }}
                >
                  {(canPickOrganisme ? customerOrganismes : customerOrganismes.filter((o) => o.id === defaultOrganismeId)).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              {error ? (
                <p className="text-sm" style={{ color: "#C0392B" }}>
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-3 py-2 text-sm" style={{ color: "#666" }} onClick={() => setEditing(null)}>
                Annuler
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#1C2340" }}
                onClick={save}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
