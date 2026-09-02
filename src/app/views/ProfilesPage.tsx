import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Profile, Role } from "../lib/types";
import {
  DOCUMENT_SCREENS,
  MODULE_ORDER,
  SCREENS,
  chipLabel,
  findScreen,
  isScreenAssigned,
  newProfile,
  profileChipIds,
} from "../lib/access";
import { ROLE_META } from "../lib/users";
import { inp, lbl } from "../lib/helpers";

function unique(ids: string[]) {
  return [...new Set(ids)];
}

function docsOf(module: Role) {
  return DOCUMENT_SCREENS.filter((s) => s.module === module);
}

function poleChecked(screenIds: string[], module: Role) {
  if (screenIds.includes(module)) return true;
  const docs = docsOf(module);
  return docs.length > 0 && docs.every((d) => screenIds.includes(d.id));
}

export function ProfilesPage({
  profiles,
  onChange,
}: {
  profiles: Profile[];
  onChange: (next: Profile[]) => void;
}) {
  const [editing, setEditing] = useState<Profile | null>(null);
  const [filter, setFilter] = useState("");

  const q = filter.trim().toLowerCase();
  const match = (label: string, role: string) =>
    !q || label.toLowerCase().includes(q) || role.toLowerCase().includes(q);

  const save = () => {
    if (!editing) return;
    const label = editing.label.trim();
    if (!label || !editing.screenIds.length) return;
    const clean = { ...editing, label, screenIds: unique(editing.screenIds) };
    const exists = profiles.some((p) => p.id === clean.id);
    onChange(exists ? profiles.map((p) => (p.id === clean.id ? clean : p)) : [clean, ...profiles]);
    setEditing(null);
    setFilter("");
  };

  const setIds = (screenIds: string[]) => {
    if (!editing) return;
    setEditing({ ...editing, screenIds: unique(screenIds) });
  };

  const toggleTool = (screenId: string) => {
    if (!editing) return;
    const has = editing.screenIds.includes(screenId);
    setIds(has ? editing.screenIds.filter((id) => id !== screenId) : [...editing.screenIds, screenId]);
  };

  const togglePole = (module: Role) => {
    if (!editing) return;
    const docs = docsOf(module);
    const on = poleChecked(editing.screenIds, module);
    if (on) {
      const drop = new Set([module, ...docs.map((d) => d.id)]);
      setIds(editing.screenIds.filter((id) => !drop.has(id)));
    } else {
      setIds([...editing.screenIds.filter((id) => !docs.some((d) => d.id === id)), module]);
    }
  };

  const toggleDoc = (docId: string) => {
    if (!editing) return;
    const screen = findScreen(docId);
    if (!screen?.module) return;
    const module = screen.module;
    const siblings = docsOf(module);
    const ids = editing.screenIds;
    const assigned = isScreenAssigned(editing, docId);

    if (assigned) {
      if (ids.includes(module)) {
        const others = siblings.filter((s) => s.id !== docId).map((s) => s.id);
        setIds([...ids.filter((id) => id !== module && id !== docId), ...others]);
      } else {
        setIds(ids.filter((id) => id !== docId));
      }
      return;
    }

    const next = [...ids, docId];
    if (siblings.every((s) => s.id === docId || next.includes(s.id) || ids.includes(module))) {
      setIds([...next.filter((id) => !siblings.some((s) => s.id === id)), module]);
    } else {
      setIds(next);
    }
  };

  const tools = useMemo(() => SCREENS.filter((s) => s.kind === "tool"), []);
  const admins = useMemo(() => SCREENS.filter((s) => s.kind === "admin"), []);

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "#1C2340" }}>
              Profils
            </h1>
            <p style={{ color: "#999", fontSize: "0.88rem", marginTop: 5 }}>
              Le libellé (ex. Facturation) n’enferme pas les écrans : cochez n’importe quel document ou outil, y compris
              l’Agenda dans un profil Facturation.
            </p>
          </div>
          <button
            onClick={() => {
              setFilter("");
              setEditing(newProfile());
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#B8923A" }}
          >
            <Plus size={15} />
            Nouveau profil
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(28,35,64,0.06)" }}>
                {["Libellé", "Écrans", ""].map((h) => (
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
              {profiles.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: i < profiles.length - 1 ? "1px solid rgba(28,35,64,0.04)" : "none" }}
                >
                  <td className="px-5 py-3.5 font-semibold" style={{ color: "#1C2340" }}>
                    {p.label}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {profileChipIds(p).map((id) => (
                        <span
                          key={id}
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(28,35,64,0.06)", color: "#555" }}
                          title={findScreen(id)?.role}
                        >
                          {chipLabel(id)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setFilter("");
                        setEditing({ ...p, screenIds: [...p.screenIds] });
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        className="p-1.5 text-muted-foreground hover:text-destructive"
                        onClick={() => onChange(profiles.filter((x) => x.id !== p.id))}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,35,64,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[92vh] overflow-auto p-6">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1C2340", fontSize: "1.2rem" }}>
              {profiles.some((p) => p.id === editing.id) ? "Modifier le profil" : "Nouveau profil"}
            </h2>
            <p className="text-xs mt-1" style={{ color: "#888" }}>
              Composez le menu comme vous voulez : les écrans ne sont pas liés au libellé.
            </p>
            <div className="mt-4">
              <label className={lbl}>Libellé</label>
              <input
                className={inp}
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                placeholder="Ex. Facturation"
              />
            </div>
            <div className="mt-3">
              <input
                className={inp}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrer un écran (ex. agenda, dépenses…)"
              />
            </div>

            <div className="mt-5">
              <div className={lbl}>Documents — à la carte</div>
              <div className="space-y-4">
                {MODULE_ORDER.map((mod) => {
                  const docs = docsOf(mod).filter((s) => match(s.label, s.role) || match(ROLE_META[mod].label, ""));
                  if (q && docs.length === 0) return null;
                  const all = poleChecked(editing.screenIds, mod);
                  return (
                    <div key={mod} className="rounded-xl border border-border p-3">
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="checkbox" checked={all} onChange={() => togglePole(mod)} />
                        <span className="text-sm font-semibold" style={{ color: "#1C2340" }}>
                          {ROLE_META[mod].label}
                        </span>
                        <span className="text-[11px]" style={{ color: "#aaa" }}>
                          tout le pôle
                        </span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {docsOf(mod)
                          .filter((s) => match(s.label, s.role))
                          .map((s) => {
                            const checked = isScreenAssigned(editing, s.id);
                            return (
                              <label
                                key={s.id}
                                className="flex items-start gap-2 p-2 rounded-lg border cursor-pointer"
                                style={{
                                  borderColor: checked ? "#1C2340" : "rgba(28,35,64,0.08)",
                                  background: checked ? "rgba(28,35,64,0.04)" : "#fff",
                                }}
                              >
                                <input type="checkbox" className="mt-0.5" checked={checked} onChange={() => toggleDoc(s.id)} />
                                <div>
                                  <div className="text-sm" style={{ color: "#1C2340" }}>
                                    {s.label}
                                  </div>
                                  <div className="text-[10px]" style={{ fontFamily: "'DM Mono', monospace", color: "#B8923A" }}>
                                    {s.role}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <ScreenGroup title="Outils" screens={tools.filter((s) => match(s.label, s.role))} ids={editing.screenIds} onToggle={toggleTool} />
            <ScreenGroup title="Administration" screens={admins.filter((s) => match(s.label, s.role))} ids={editing.screenIds} onToggle={toggleTool} />

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-3 py-2 text-sm"
                style={{ color: "#666" }}
                onClick={() => {
                  setEditing(null);
                  setFilter("");
                }}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "#1C2340" }}
                onClick={save}
                disabled={!editing.label.trim() || !editing.screenIds.length}
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

function ScreenGroup({
  title,
  screens,
  ids,
  onToggle,
}: {
  title: string;
  screens: { id: string; label: string; role: string }[];
  ids: string[];
  onToggle: (id: string) => void;
}) {
  if (!screens.length) return null;
  return (
    <div className="mt-5">
      <div className={lbl}>{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {screens.map((s) => {
          const checked = ids.includes(s.id);
          return (
            <label
              key={s.id}
              className="flex items-start gap-2 p-2 rounded-lg border cursor-pointer"
              style={{
                borderColor: checked ? "#1C2340" : "rgba(28,35,64,0.08)",
                background: checked ? "rgba(28,35,64,0.04)" : "#fff",
              }}
            >
              <input type="checkbox" className="mt-0.5" checked={checked} onChange={() => onToggle(s.id)} />
              <div>
                <div className="text-sm" style={{ color: "#1C2340" }}>
                  {s.label}
                </div>
                <div className="text-[10px]" style={{ fontFamily: "'DM Mono', monospace", color: "#B8923A" }}>
                  {s.role}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
