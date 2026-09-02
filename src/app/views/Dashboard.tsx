import {
  ArrowRight,
  Clock3,
  FilePlus2,
  FolderKanban,
  Layers,
  PenLine,
  Sparkles,
} from "lucide-react";
import type { DocTemplate, SavedDocument, User } from "../lib/types";
import { statusColor } from "../lib/helpers";

export function Dashboard({
  user,
  profileLabel,
  catalog,
  docs,
  onOpenTemplate,
  onLibrary,
  onDesigner,
  onOpenDoc,
  canLibrary = true,
  canDesigner = true,
}: {
  user: User;
  profileLabel: string;
  catalog: DocTemplate[];
  docs: SavedDocument[];
  onOpenTemplate: (id: string) => void;
  onLibrary: () => void;
  onDesigner: () => void;
  onOpenDoc: (doc: SavedDocument) => void;
  canLibrary?: boolean;
  canDesigner?: boolean;
}) {
  const firstName = user.name.split(" ")[0];
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const featured = catalog[0];
  const rest = catalog.slice(1);

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 lg:px-10 lg:py-8 max-w-6xl mx-auto">
        <section
          className="relative overflow-hidden rounded-2xl mb-7 text-white"
          style={{
            background: "linear-gradient(135deg, #1C2340 0%, #243056 55%, #1a2744 100%)",
          }}
        >
          <div
            className="absolute -right-16 -top-20 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "rgba(184,146,58,0.16)" }}
          />
          <div
            className="absolute right-24 -bottom-24 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
          <div className="relative px-7 py-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-3"
                style={{ background: "rgba(184,146,58,0.18)", color: "#E8C97A" }}
              >
                <Sparkles size={12} />
                <span style={{ fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>
                  {profileLabel}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "2rem",
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                Bonjour {firstName}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", marginTop: 8, maxWidth: 420 }}>
                {today.charAt(0).toUpperCase() + today.slice(1)} — créez un document de votre pôle, ou partez d’un
                modèle existant.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canLibrary && (
                <button
                  onClick={onLibrary}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "#B8923A", color: "#fff" }}
                >
                  <FilePlus2 size={16} />
                  Nouveau document
                </button>
              )}
              {canDesigner && (
                <button
                  onClick={onDesigner}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                >
                  <PenLine size={15} />
                  Créer un modèle
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, color: "#1C2340" }}>
                Modèles du pôle
              </h2>
              {canLibrary && (
                <button
                  onClick={onLibrary}
                  className="flex items-center gap-1 text-xs font-semibold hover:opacity-80"
                  style={{ color: "#B8923A" }}
                >
                  Bibliothèque <ArrowRight size={13} />
                </button>
              )}
            </div>

            {featured && (
              <button
                onClick={() => onOpenTemplate(featured.id)}
                className="w-full text-left rounded-2xl overflow-hidden border border-border bg-card group transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex min-h-[132px]">
                  <div
                    className="w-[7.5rem] flex-shrink-0 flex flex-col items-center justify-center"
                    style={{ background: featured.color }}
                  >
                    <span style={{ fontSize: "2.1rem" }}>{featured.icon}</span>
                    <span
                      className="mt-2 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      Suggéré
                    </span>
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-center">
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, color: "#1C2340" }}>
                      {featured.name}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "#8a8a9a", marginTop: 6, maxWidth: 420 }}>{featured.description}</p>
                    <div
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                      style={{ color: "#B8923A" }}
                    >
                      Commencer <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rest.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpenTemplate(t.id)}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border bg-card text-left transition-all hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: t.color }}
                  >
                    {t.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div style={{ fontWeight: 700, color: "#1C2340", fontSize: "0.9rem" }}>{t.name}</div>
                    <div className="truncate" style={{ fontSize: "0.75rem", color: "#9a9aa8", marginTop: 2 }}>
                      {t.description}
                    </div>
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#B8923A" }} />
                </button>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{ background: "#1C2340" }}
                >
                  {user.initials}
                </div>
                <div className="min-w-0">
                  <div style={{ fontWeight: 700, color: "#1C2340" }}>{user.name}</div>
                  <div className="truncate text-xs" style={{ color: "#8a8a9a" }}>
                    {user.title}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3" style={{ background: "#F7F6F2" }}>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: "#B8923A" }}>
                    <FolderKanban size={13} />
                    <span style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                      Documents
                    </span>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.45rem", color: "#1C2340" }}>{docs.length}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#F7F6F2" }}>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: "#B8923A" }}>
                    <Layers size={13} />
                    <span style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                      Modèles
                    </span>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.45rem", color: "#1C2340" }}>{catalog.length}</div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "#9a9aa8" }}>
                {user.companyEmail || user.login}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2" style={{ color: "#1C2340" }}>
                  <Clock3 size={15} />
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "0.95rem" }}>
                    Activité récente
                  </span>
                </div>
              </div>
              {docs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div
                    className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(184,146,58,0.12)", color: "#B8923A" }}
                  >
                    <FilePlus2 size={20} />
                  </div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1C2340" }}>Rien pour l’instant</p>
                  <p style={{ fontSize: "0.78rem", color: "#9a9aa8", marginTop: 6, lineHeight: 1.5 }}>
                    Les documents que vous exporterez apparaîtront ici.
                  </p>
                  {featured && (
                    <button
                      onClick={() => onOpenTemplate(featured.id)}
                      className="mt-4 text-xs font-semibold px-3 py-2 rounded-lg"
                      style={{ background: "#1C2340", color: "#fff" }}
                    >
                      Créer « {featured.name} »
                    </button>
                  )}
                </div>
              ) : (
                <ul>
                  {docs.slice(0, 5).map((doc, i) => (
                    <li key={doc.id}>
                      <button
                        onClick={() => onOpenDoc(doc)}
                        className="w-full text-left px-5 py-3 hover:bg-muted transition-colors"
                        style={{ borderBottom: i < Math.min(docs.length, 5) - 1 ? "1px solid rgba(28,35,64,0.05)" : "none" }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold" style={{ color: "#1C2340" }}>
                              {doc.name}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "#9a9aa8" }}>
                              {doc.templateName} · {doc.date}
                            </div>
                          </div>
                          <span
                            className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: statusColor(doc.status) + "18", color: statusColor(doc.status) }}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
