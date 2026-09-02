import { useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Organisme } from "../lib/types";
import { ORG_SYSTEM, newOrganisme } from "../lib/access";
import { CURRENCY_OPTIONS, inp, lbl } from "../lib/helpers";

export function OrganismesPage({
  organismes,
  onChange,
  userCountByOrg,
}: {
  organismes: Organisme[];
  onChange: (next: Organisme[]) => void;
  userCountByOrg: (id: string) => number;
}) {
  const [editing, setEditing] = useState<Organisme | null>(null);

  const save = () => {
    if (!editing || !editing.name.trim()) return;
    const clean = { ...editing, name: editing.name.trim() };
    const exists = organismes.some((o) => o.id === clean.id);
    let next = exists ? organismes.map((o) => (o.id === clean.id ? clean : o)) : [clean, ...organismes];
    const systemOrg = organismes.find((o) => o.id === ORG_SYSTEM);
    if (systemOrg && !next.some((o) => o.id === ORG_SYSTEM)) next = [...next, systemOrg];
    onChange(next);
    setEditing(null);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "#1C2340" }}>
              Organismes
            </h1>
            <p style={{ color: "#999", fontSize: "0.88rem", marginTop: 5 }}>
              Créez un organisme, puis un utilisateur rattaché à cet organisme. L’utilisateur pourra ensuite se connecter et travailler.
            </p>
          </div>
          <button
            onClick={() => setEditing(newOrganisme())}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#B8923A" }}
          >
            <Plus size={15} />
            Nouvel organisme
          </button>
        </div>

        {organismes.filter((o) => o.id !== ORG_SYSTEM).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm" style={{ color: "#888" }}>
            Aucun organisme client. Cliquez sur « Nouvel organisme » pour commencer.
          </div>
        ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(28,35,64,0.06)" }}>
                {["Organisme", "Adresse", "Devise", "Utilisateurs", ""].map((h) => (
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
              {organismes.filter((o) => o.id !== ORG_SYSTEM).map((o, i, list) => (
                <tr key={o.id} style={{ borderBottom: i < list.length - 1 ? "1px solid rgba(28,35,64,0.04)" : "none" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center overflow-hidden" style={{ background: "#F7F6F2" }}>
                        {o.logo ? <img src={o.logo} alt="" className="max-w-full max-h-full object-contain" /> : <Building2 size={16} style={{ color: "#bbb" }} />}
                      </div>
                      <span className="font-semibold text-sm" style={{ color: "#1C2340" }}>
                        {o.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>
                    {o.address || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ fontFamily: "'DM Mono', monospace", color: "#555" }}>
                    {o.currency}
                  </td>
                  <td className="px-5 py-3.5 text-sm">{userCountByOrg(o.id)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => setEditing({ ...o })}>
                      <Pencil size={14} />
                    </button>
                    {o.id !== ORG_SYSTEM && userCountByOrg(o.id) === 0 && (
                      <button className="p-1.5 text-muted-foreground hover:text-destructive" onClick={() => onChange(organismes.filter((x) => x.id !== o.id))}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,35,64,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1C2340", fontSize: "1.2rem" }}>
              {organismes.some((o) => o.id === editing.id) ? "Modifier l’organisme" : "Nouvel organisme"}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className={lbl}>Nom</label>
                <input className={inp} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Adresse</label>
                <textarea className={inp} rows={2} value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Devise par défaut</label>
                <select className={inp} value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value as Organisme["currency"] })}>
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-3 py-2 text-sm" style={{ color: "#666" }} onClick={() => setEditing(null)}>
                Annuler
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#1C2340" }} onClick={save} disabled={!editing.name.trim()}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
