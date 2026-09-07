import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  Clock,
  Copy,
  Download,
  Home,
  Layers,
  LogOut,
  PenLine,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { DocData, DocTemplate, ExpenseMonth, Organisme, Profile, RentalMonth, SavedDocument, User, View } from "./lib/types";
import { ROLE_META } from "./lib/users";
import {
  findTemplate,
  normalizeTemplateId,
  selectableModels,
  storedByUser,
  cloneAsStored,
  templatesForAllowedIds,
} from "./lib/templates";
import {
  fetchBootstrap,
  logoutUser,
  saveAppUsers,
  saveCustomTemplates,
  saveDocuments,
  saveExpenseMonths,
  saveRentalMonths,
  saveOrganismes,
  saveProfiles,
  tryRestoreSession,
} from "./lib/storage";
import type { BootstrapData } from "./lib/api";
import {
  allowedTemplateIds,
  applyOrganisme,
  belongsToOrganisme,
  findOrganisme,
  hasScreen,
  modulesOf,
  ORG_SYSTEM,
  profileOf,
  syncUserRole,
} from "./lib/access";
import { expenseMonthId } from "./lib/expenses";
import { rentalMonthId } from "./lib/rentals";
import { statusColor } from "./lib/helpers";
import { LoginPage } from "./views/LoginPage";
import { MobileBlockedPage } from "./views/MobileBlockedPage";
import { Dashboard } from "./views/Dashboard";
import { TemplateDesigner } from "./designer/TemplateDesigner";
import { ProfilesPage } from "./views/ProfilesPage";
import { UsersPage } from "./views/UsersPage";
import { ExpensesPage } from "./views/ExpensesPage";
import { RentalsPage } from "./views/RentalsPage";
import { TemplateWorkspacePage } from "./views/TemplateWorkspacePage";
import { SettingsPage } from "./views/SettingsPage";
import { OrganismesPage } from "./views/OrganismesPage";
import { OrganismeProvider, type OrganismesUpdater } from "./lib/settings";
import { useIsMobile } from "./components/ui/use-mobile";

const VIEW_SCREEN: Partial<Record<View, string>> = {
  dashboard: "dashboard",
  templates: "library",
  library: "library",
  designer: "designer",
  documents: "documents",
  depenses: "depenses",
  locations: "locations",
  settings: "settings",
  profiles: "profiles",
  users: "users",
  organismes: "organismes",
};

function defaultView(profile: Profile | null): View {
  if (profile?.id === "p-superadmin") return "organismes";
  if (hasScreen(profile, "dashboard")) return "dashboard";
  if (hasScreen(profile, "depenses")) return "depenses";
  if (hasScreen(profile, "locations")) return "locations";
  if (hasScreen(profile, "library")) return "library";
  if (hasScreen(profile, "settings")) return "settings";
  if (hasScreen(profile, "profiles")) return "profiles";
  if (hasScreen(profile, "users")) return "users";
  if (hasScreen(profile, "documents")) return "documents";
  return "dashboard";
}

function Workspace({
  user,
  profiles,
  users,
  organismes,
  allDocuments,
  setAllDocuments,
  allTemplates,
  setAllTemplates,
  allExpenseMonths,
  setAllExpenseMonths,
  allRentalMonths,
  setAllRentalMonths,
  onOrganismesChange,
  onProfilesChange,
  onUsersChange,
  onLogout,
}: {
  user: User;
  profiles: Profile[];
  users: User[];
  organismes: Organisme[];
  allDocuments: SavedDocument[];
  setAllDocuments: (next: SavedDocument[]) => void;
  allTemplates: DocTemplate[];
  setAllTemplates: (next: DocTemplate[]) => void;
  allExpenseMonths: ExpenseMonth[];
  setAllExpenseMonths: (next: ExpenseMonth[]) => void;
  allRentalMonths: RentalMonth[];
  setAllRentalMonths: (next: RentalMonth[]) => void;
  onOrganismesChange: (next: OrganismesUpdater) => void | Promise<void>;
  onProfilesChange: (organismeId: string, p: Profile[]) => void;
  onUsersChange: (u: User[]) => void | Promise<void>;
  onLogout: () => void;
}) {
  const profile = profileOf(user, profiles);
  const modules = modulesOf(profile);
  const can = (id: string) => hasScreen(profile, id);
  const roleMeta = ROLE_META[user.role] ?? ROLE_META.facturation;

  const [view, setView] = useState<View>(() => defaultView(profile));
  const [search, setSearch] = useState("");
  const customerOrganismes = useMemo(() => organismes.filter((o) => o.id !== ORG_SYSTEM), [organismes]);
  const [profilesOrganismeId, setProfilesOrganismeId] = useState(
    () => (user.organismeId !== ORG_SYSTEM ? user.organismeId : customerOrganismes[0]?.id ?? user.organismeId)
  );

  useEffect(() => {
    if (organismes.some((o) => o.id === profilesOrganismeId)) return;
    const fallback =
      user.organismeId !== ORG_SYSTEM ? user.organismeId : customerOrganismes[0]?.id ?? user.organismeId;
    if (fallback) setProfilesOrganismeId(fallback);
  }, [organismes, customerOrganismes, profilesOrganismeId, user.organismeId]);
  const customTemplates = useMemo(
    () => allTemplates.filter((t) => belongsToOrganisme(t, user.organismeId)),
    [allTemplates, user.organismeId]
  );
  const documents = useMemo(
    () => allDocuments.filter((d) => belongsToOrganisme(d, user.organismeId)),
    [allDocuments, user.organismeId]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DocTemplate | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [saveAsData, setSaveAsData] = useState<DocData>({});

  const allowedIds = useMemo(() => allowedTemplateIds(profile), [profile]);
  const catalog = useMemo(() => templatesForAllowedIds(allowedIds, customTemplates), [allowedIds, customTemplates]);
  const selected = selectedId ? findTemplate(selectedId, customTemplates) : undefined;
  const myDocs = documents.filter((d) => d.authorId === user.id || modules.includes(d.category));
  const myStored = useMemo(() => storedByUser(customTemplates, user), [customTemplates, user]);
  const modelChoices = selected ? selectableModels(selected, customTemplates, user) : [];

  const goTo = (v: View) => {
    const needed = VIEW_SCREEN[v];
    if (needed && !can(needed) && v !== "editor") return;
    setView(v);
    if (v !== "editor" && v !== "designer") {
      setSelectedId(null);
      setEditingTemplate(null);
    }
  };

  useEffect(() => {
    const needed = VIEW_SCREEN[view];
    if (needed && !hasScreen(profile, needed)) setView(defaultView(profile));
  }, [profile, view]);

  const openTemplate = (id: string, docId?: string) => {
    const tpl = findTemplate(normalizeTemplateId(id), customTemplates);
    if (!tpl) return;
    if (tpl.builtin && allowedIds.length && !allowedIds.includes(tpl.id)) return;
    if (!tpl.builtin && tpl.category && modules.length && !modules.includes(tpl.category) && tpl.ownerId !== user.id) return;
    setSelectedId(id);
    setOpenDocId(docId ?? null);
    setView("editor");
  };

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2800);
  };

  const allDocumentsRef = useRef(allDocuments);
  allDocumentsRef.current = allDocuments;
  const documentsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const documentsSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingDocumentsRef = useRef<SavedDocument[] | null>(null);
  const rentalSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rentalSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingRentalsRef = useRef<RentalMonth[] | null>(null);
  const rentalSaveSeq = useRef(0);
  const expenseSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const expenseSaveSeq = useRef(0);
  const allExpenseMonthsRef = useRef(allExpenseMonths);
  allExpenseMonthsRef.current = allExpenseMonths;

  const flushDocumentSave = useCallback(() => {
    const payload = pendingDocumentsRef.current;
    if (!payload) return;
    pendingDocumentsRef.current = null;
    documentsSaveQueue.current = documentsSaveQueue.current
      .then(() => saveDocuments(payload))
      .then((saved) => setAllDocuments(saved))
      .catch((err) => {
        console.error(err);
        flash("Erreur lors de l'enregistrement des documents.");
      });
  }, [setAllDocuments]);

  const persistDocs = useCallback(
    (
      input: SavedDocument[] | ((orgDocs: SavedDocument[]) => SavedDocument[]),
      options?: { immediate?: boolean }
    ) => {
      const prev = allDocumentsRef.current;
      const orgId = user.organismeId;
      const orgDocs = prev.filter((d) => belongsToOrganisme(d, orgId));
      const others = prev.filter((d) => !belongsToOrganisme(d, orgId));
      const nextOrg = (typeof input === "function" ? input(orgDocs) : input).map((d) => ({
        ...d,
        organismeId: orgId,
      }));
      const next = [...nextOrg, ...others];
      pendingDocumentsRef.current = next;
      setAllDocuments(next);
      if (documentsSaveTimer.current) clearTimeout(documentsSaveTimer.current);
      if (options?.immediate) {
        flushDocumentSave();
      } else {
        documentsSaveTimer.current = setTimeout(flushDocumentSave, 500);
      }
    },
    [user.organismeId, setAllDocuments, flushDocumentSave]
  );

  /** Mise à jour locale uniquement — la base n’est touchée que via saveExpenseMonthsNow. */
  const persistExpenseMonths = useCallback(
    (update: (orgMonths: ExpenseMonth[]) => ExpenseMonth[]) => {
      setAllExpenseMonths((prev) => {
        const orgId = user.organismeId;
        const orgMonths = prev.filter((m) => !m.organismeId || m.organismeId === orgId);
        const others = prev.filter((m) => m.organismeId && m.organismeId !== orgId);
        const updatedOrg = update(orgMonths).map((m) => ({
          ...m,
          organismeId: orgId,
          id: expenseMonthId(orgId, m.year, m.month),
        }));
        const next = [...updatedOrg, ...others];
        allExpenseMonthsRef.current = next;
        return next;
      });
    },
    [user.organismeId, setAllExpenseMonths]
  );

  /** Persiste en base toutes les lignes de dépenses de l’organisme courant. */
  const saveExpenseMonthsNow = useCallback(() => {
    const orgId = user.organismeId;
    const prev = allExpenseMonthsRef.current;
    const orgMonths = prev
      .filter((m) => !m.organismeId || m.organismeId === orgId)
      .map((m) => ({
        ...m,
        organismeId: orgId,
        id: expenseMonthId(orgId, m.year, m.month),
      }));
    const toSave = orgMonths.filter((m) => m.lines.length > 0 || m.sealed);
    const seq = ++expenseSaveSeq.current;

    const job = expenseSaveQueue.current
      .then(() => saveExpenseMonths(toSave))
      .then((saved) => {
        if (seq !== expenseSaveSeq.current) return;
        setAllExpenseMonths((current) => {
          const otherOrgs = current.filter((m) => m.organismeId && m.organismeId !== orgId);
          const next = [...saved.map((m) => ({ ...m, organismeId: m.organismeId || orgId })), ...otherOrgs];
          allExpenseMonthsRef.current = next;
          return next;
        });
        flash("Dépenses enregistrées.");
      })
      .catch((err) => {
        console.error(err);
        flash("Erreur lors de l'enregistrement des dépenses.");
        throw err;
      });

    expenseSaveQueue.current = job.catch(() => {});
    return job;
  }, [user.organismeId, setAllExpenseMonths]);

  const persistRentalMonths = useCallback(
    (update: (orgMonths: RentalMonth[]) => RentalMonth[], options?: { immediate?: boolean }) => {
      setAllRentalMonths((prev) => {
        const orgId = user.organismeId;
        const orgMonths = prev.filter((m) => !m.organismeId || m.organismeId === orgId);
        const others = prev.filter((m) => m.organismeId && m.organismeId !== orgId);
        const updatedOrg = update(orgMonths).map((m) => ({
          ...m,
          organismeId: orgId,
          id: rentalMonthId(orgId, m.year, m.month),
        }));
        const next = [...updatedOrg, ...others];
        const toSave = next.filter((m) => m.lines.length > 0 || m.sealed);

        const seq = ++rentalSaveSeq.current;
        pendingRentalsRef.current = toSave;

        const flush = () => {
          const payload = pendingRentalsRef.current;
          if (!payload) return;
          pendingRentalsRef.current = null;
          rentalSaveQueue.current = rentalSaveQueue.current
            .then(() => saveRentalMonths(payload))
            .then((saved) => {
              if (seq !== rentalSaveSeq.current) return;
              setAllRentalMonths((current) => {
                const currentOrg = current.filter((m) => !m.organismeId || m.organismeId === orgId);
                const newerLocal = currentOrg.some((m) => {
                  const s = saved.find((x) => x.id === m.id || (x.year === m.year && x.month === m.month));
                  return !s && m.lines.length > 0;
                });
                if (newerLocal) return current;
                const otherOrgs = current.filter((m) => m.organismeId && m.organismeId !== orgId);
                return [...saved.map((m) => ({ ...m, organismeId: m.organismeId || orgId })), ...otherOrgs];
              });
            })
            .catch((err) => {
              console.error(err);
              flash("Erreur lors de l'enregistrement des locations.");
            });
        };

        if (rentalSaveTimer.current) clearTimeout(rentalSaveTimer.current);
        if (options?.immediate) flush();
        else rentalSaveTimer.current = setTimeout(flush, 350);

        return next;
      });
    },
    [user.organismeId, setAllRentalMonths]
  );

  const persistTemplates = (orgTemplates: DocTemplate[]) => {
    const tagged = orgTemplates.map((t) => ({ ...t, organismeId: user.organismeId }));
    const others = allTemplates.filter((t) => t.organismeId && t.organismeId !== user.organismeId);
    const next = [...tagged, ...others];
    setAllTemplates(next);
    void saveCustomTemplates(next).catch((err) => {
      console.error(err);
      flash("Erreur lors de l'enregistrement des modèles.");
    });
  };

  const applyModel = (id: string) => {
    setSelectedId(id);
  };

  const handleSaveTemplate = (tpl: DocTemplate) => {
    const withOrg = { ...tpl, organismeId: user.organismeId };
    const exists = customTemplates.some((t) => t.id === withOrg.id);
    persistTemplates(exists ? customTemplates.map((t) => (t.id === withOrg.id ? withOrg : t)) : [withOrg, ...customTemplates]);
    setEditingTemplate(null);
    setView("library");
    flash(exists ? `« ${withOrg.name} » a été mis à jour.` : `« ${withOrg.name} » a été enregistré dans vos modèles.`);
  };

  const saveCurrentAsTemplate = (data: DocData) => {
    if (!selected) return;
    const copy = cloneAsStored(selected, user, saveAsName || `${selected.name} — ${user.name}`, data);
    persistTemplates([copy, ...customTemplates.filter((t) => t.id !== copy.id)]);
    setSaveAsOpen(false);
    setSaveAsName("");
    setSelectedId(copy.id);
    flash(`Modèle « ${copy.name} » enregistré. Vous pourrez le réutiliser à la prochaine génération.`);
  };

  const filtered = catalog.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F7F6F2" }}>
      <aside className="flex flex-col w-[11.5rem] flex-shrink-0" style={{ background: "#1C2340", color: "#fff" }}>
        <div className="px-3 pt-5 pb-3">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700 }}>DocForge</div>
          <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
            {profile?.label || roleMeta.label}
          </div>
        </div>

        {can("library") && (
        <div className="px-3 mb-3">
          <button
            onClick={() => goTo("templates")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{ background: "#B8923A", color: "#fff" }}
          >
            <Plus size={13} />
            Nouveau document
          </button>
        </div>
        )}

        <nav className="px-2 space-y-0.5 flex-1 overflow-auto">
          {can("dashboard") && (
            <NavBtn active={view === "dashboard"} onClick={() => goTo("dashboard")} icon={<Home size={14} />}>
              Tableau de bord
            </NavBtn>
          )}

          {(catalog.filter((t) => t.builtin).length > 0 || can("depenses") || can("locations")) && (
            <div className="my-2 mx-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
          )}

          {catalog
            .filter((t) => t.builtin)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => openTemplate(t.id)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all"
                style={{
                  color: selectedId === t.id && view === "editor" ? "#fff" : "rgba(255,255,255,0.55)",
                  background: selectedId === t.id && view === "editor" ? "rgba(255,255,255,0.1)" : "transparent",
                  fontWeight: selectedId === t.id && view === "editor" ? 600 : 400,
                }}
              >
                <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>{t.icon}</span>
                <span className="truncate">{t.name}</span>
              </button>
            ))}

          {can("depenses") && (
            <button
              onClick={() => goTo("depenses")}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all"
              style={{
                color: view === "depenses" ? "#fff" : "rgba(255,255,255,0.55)",
                background: view === "depenses" ? "rgba(255,255,255,0.1)" : "transparent",
                fontWeight: view === "depenses" ? 600 : 400,
              }}
            >
              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🧾</span>
              <span className="truncate">Suivi des dépenses</span>
            </button>
          )}

          {can("locations") && (
            <button
              onClick={() => goTo("locations")}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all"
              style={{
                color: view === "locations" ? "#fff" : "rgba(255,255,255,0.55)",
                background: view === "locations" ? "rgba(255,255,255,0.1)" : "transparent",
                fontWeight: view === "locations" ? 600 : 400,
              }}
            >
              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🚗</span>
              <span className="truncate">Suivi des locations</span>
            </button>
          )}

          {myStored.length > 0 && (
            <>
              <div className="my-2 mx-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
              {myStored.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTemplate(t.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs truncate"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>✨</span>
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </>
          )}

          {(can("library") || can("designer") || can("documents") || can("settings")) && (
            <div className="my-2 mx-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
          )}
          {can("library") && (
            <NavBtn active={view === "library" || view === "templates"} onClick={() => goTo("library")} icon={<Layers size={14} />}>
              Bibliothèque
            </NavBtn>
          )}
          {can("designer") && (
            <NavBtn
              active={view === "designer"}
              onClick={() => {
                setEditingTemplate(null);
                setView("designer");
              }}
              icon={<PenLine size={14} />}
            >
              Créer un modèle
            </NavBtn>
          )}
          {can("documents") && (
            <NavBtn active={view === "documents"} onClick={() => goTo("documents")} icon={<Clock size={14} />}>
              Mes documents
            </NavBtn>
          )}
          {can("settings") && (
            <NavBtn active={view === "settings"} onClick={() => goTo("settings")} icon={<Settings size={14} />}>
              Paramétrage
            </NavBtn>
          )}

          {(can("profiles") || can("users") || can("organismes")) && (
            <div className="my-2 mx-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
          )}
          {can("organismes") && (
            <NavBtn active={view === "organismes"} onClick={() => goTo("organismes")} icon={<Building2 size={14} />}>
              Organismes
            </NavBtn>
          )}
          {can("profiles") && (
            <NavBtn active={view === "profiles"} onClick={() => goTo("profiles")} icon={<Shield size={14} />}>
              Profils
            </NavBtn>
          )}
          {can("users") && (
            <NavBtn active={view === "users"} onClick={() => goTo("users")} icon={<Users size={14} />}>
              Utilisateurs
            </NavBtn>
          )}
        </nav>

        <div className="px-2 pb-4 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 px-1.5 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: "#B8923A" }}>
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{user.name}</div>
              <div className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                {user.title}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <LogOut size={14} />
            Changer de compte
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden min-w-0">
        {view === "designer" && can("designer") && (
          <TemplateDesigner
            user={user}
            modules={modules}
            initial={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => goTo("library")}
          />
        )}

        {view === "dashboard" && (
          <Dashboard
            user={user}
            profileLabel={profile?.label || roleMeta.label}
            catalog={catalog}
            docs={myDocs}
            canDepenses={can("depenses")}
            onOpenDepenses={() => goTo("depenses")}
            canLocations={can("locations")}
            onOpenLocations={() => goTo("locations")}
            onOpenTemplate={openTemplate}
            onLibrary={() => goTo("library")}
            onDesigner={() => {
              if (!can("designer")) return;
              setEditingTemplate(null);
              setView("designer");
            }}
            canLibrary={can("library")}
            canDesigner={can("designer")}
            onOpenDoc={(doc) => openTemplate(doc.templateId, doc.id)}
          />
        )}

        {(view === "templates" || view === "library") && (
          <div className="h-full overflow-auto">
            <div className="p-5 max-w-5xl mx-auto">
              <div className="mb-4">
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, color: "#1C2340" }}>
                  Bibliothèque
                </h1>
                <p style={{ color: "#999", fontSize: "0.75rem", marginTop: 3 }}>
                  Modèles standard et modèles enregistrés sur cet appareil.
                </p>
              </div>

              <div className="relative mb-4">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#bbb" }} />
                <input
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Rechercher un modèle…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="mb-5">
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.9rem", fontWeight: 600, color: "#1C2340", marginBottom: 8 }}>
                  Mes modèles enregistrés
                </h2>
                {myStored.filter(
                  (t) =>
                    t.name.toLowerCase().includes(search.toLowerCase()) ||
                    t.description.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-xs" style={{ color: "#8a8a9a" }}>
                    Aucun modèle enregistré. Dupliquez un modèle standard ou créez-en un dans l’atelier.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {myStored
                      .filter(
                        (t) =>
                          t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.description.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((t) => (
                        <div key={t.id} className="bg-card rounded-lg overflow-hidden border border-border text-left">
                          <button onClick={() => openTemplate(t.id)} className="w-full text-left">
                            <div className="h-12 flex items-center justify-center" style={{ background: t.color }}>
                              <span style={{ fontSize: "1.25rem" }}>{t.icon}</span>
                            </div>
                            <div className="p-2.5">
                              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B8923A", fontWeight: 600 }}>
                                Enregistré
                              </div>
                              <div className="text-xs font-bold truncate" style={{ fontFamily: "'Playfair Display', serif", color: "#1C2340" }}>
                                {t.name}
                              </div>
                            </div>
                          </button>
                          <div className="px-2.5 pb-2 flex gap-2">
                            <button className="text-[10px] font-semibold" style={{ color: "#1C2340" }} onClick={() => { setEditingTemplate(t); setView("designer"); }}>
                              Modifier
                            </button>
                            <button className="text-[10px] text-destructive" onClick={() => persistTemplates(customTemplates.filter((x) => x.id !== t.id))}>
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.9rem", fontWeight: 600, color: "#1C2340", marginBottom: 8 }}>
                Modèles standard
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {filtered
                  .filter((t) => t.builtin)
                  .map((t) => (
                  <div key={t.id} className="bg-card rounded-lg overflow-hidden border border-border text-left">
                    <button onClick={() => openTemplate(t.id)} className="w-full text-left">
                      <div className="h-12 flex items-center justify-center" style={{ background: t.color }}>
                        <span style={{ fontSize: "1.25rem" }}>{t.icon}</span>
                      </div>
                      <div className="p-2.5">
                        <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B8923A", fontWeight: 600 }}>
                          Standard
                        </div>
                        <div className="text-xs font-bold truncate" style={{ fontFamily: "'Playfair Display', serif", color: "#1C2340" }}>
                          {t.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                      </div>
                    </button>
                    <div className="px-2.5 pb-2">
                      <button
                        className="flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: "#1C2340" }}
                        onClick={() => {
                          const copy = cloneAsStored(t, user, `${t.name} — ${user.name.split(" ")[0]}`);
                          persistTemplates([copy, ...customTemplates]);
                          flash(`« ${copy.name} » enregistré.`);
                        }}
                      >
                        <Copy size={10} />
                        Copie
                      </button>
                    </div>
                  </div>
                ))}
                {can("designer") && (
                <button
                  onClick={() => { setEditingTemplate(null); setView("designer"); }}
                  className="rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center min-h-[120px] hover:bg-card transition-colors"
                >
                  <PenLine size={18} style={{ color: "#B8923A" }} />
                  <div className="mt-1.5 text-xs font-semibold" style={{ color: "#1C2340" }}>Créer un modèle</div>
                </button>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "editor" && selected && (
          <TemplateWorkspacePage
            key={selected.id}
            template={selected}
            user={user}
            documents={documents}
            onDocumentsChange={persistDocs}
            modelChoices={modelChoices}
            onApplyModel={applyModel}
            initialDocId={openDocId}
            onInitialDocConsumed={() => setOpenDocId(null)}
            onSaveAsTemplate={(data) => {
              setSaveAsData(data);
              setSaveAsName(`${selected.name} — ${user.name.split(" ")[0]}`);
              setSaveAsOpen(true);
            }}
          />
        )}

        {view === "depenses" && can("depenses") && (
          <ExpensesPage
            user={user}
            allMonths={allExpenseMonths}
            onPersist={persistExpenseMonths}
            onSave={saveExpenseMonthsNow}
          />
        )}

        {view === "locations" && can("locations") && (
          <RentalsPage
            user={user}
            allMonths={allRentalMonths}
            onPersist={persistRentalMonths}
          />
        )}

        {view === "settings" && can("settings") && (
          <SettingsPage onSaved={() => flash("Paramètres enregistrés pour votre organisme.")} />
        )}

        {view === "organismes" && can("organismes") && (
          <OrganismesPage
            organismes={organismes}
            userCountByOrg={(id) => users.filter((u) => u.organismeId === id).length}
            onChange={async (next) => {
              try {
                await onOrganismesChange(next);
                flash("Organismes mis à jour.");
              } catch {
                flash("Erreur — organisme non enregistré. Redémarrez l'API (npm run dev:server).");
              }
            }}
          />
        )}

        {view === "profiles" && can("profiles") && (
          <ProfilesPage
            profiles={profiles}
            organismes={organismes}
            organismeId={profilesOrganismeId}
            canPickOrganisme={can("organismes")}
            onOrganismeIdChange={setProfilesOrganismeId}
            onChange={(next) => {
              onProfilesChange(profilesOrganismeId, next);
              flash("Profils mis à jour.");
            }}
          />
        )}

        {view === "users" && can("users") && (
          <UsersPage
            users={can("organismes") ? users : users.filter((u) => u.organismeId === user.organismeId)}
            profiles={profiles}
            organismes={organismes}
            canPickOrganisme={can("organismes")}
            defaultOrganismeId={
              organismes.find((o) => o.id !== ORG_SYSTEM)?.id ?? user.organismeId
            }
            onChange={(next) => {
              const merged = can("organismes")
                ? next
                : [...users.filter((u) => u.organismeId !== user.organismeId), ...next];
              void (async () => {
                try {
                  await onUsersChange(merged.map((u) => syncUserRole(u, profiles)));
                  flash("Utilisateurs mis à jour.");
                } catch {
                  flash("Erreur — utilisateur non enregistré.");
                }
              })();
            }}
          />
        )}

        {view === "documents" && can("documents") && (
          <div className="h-full overflow-auto">
            <div className="p-8 max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "#1C2340" }}>
                  Mes documents
                </h1>
                <p style={{ color: "#999", fontSize: "0.88rem", marginTop: 5 }}>Historique des exports de votre profil.</p>
              </div>
              <RecentTable
                docs={myDocs}
                showActions
                onOpen={(doc) => openTemplate(doc.templateId, doc.id)}
              />
            </div>
          </div>
        )}
      </main>
      {notice && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg"
          style={{ background: "#1C2340" }}
        >
          {notice}
        </div>
      )}
      {saveAsOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(28,35,64,0.4)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1C2340", fontSize: "1.15rem" }}>
              Enregistrer ce modèle
            </h3>
            <p className="text-sm mt-2" style={{ color: "#888", lineHeight: 1.5 }}>
              Il sera stocké dans votre bibliothèque et proposé dans le menu Modèle à la prochaine génération.
            </p>
            <input
              className="w-full mt-4 px-3 py-2.5 rounded-lg border border-border text-sm"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              placeholder="Nom du modèle"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setSaveAsOpen(false)} className="px-3 py-2 text-sm" style={{ color: "#666" }}>
                Annuler
              </button>
              <button
                onClick={() => saveCurrentAsTemplate(saveAsData)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#B8923A" }}
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

function NavBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all"
      style={{
        background: active ? "rgba(255,255,255,0.1)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.45)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function RecentTable({
  docs,
  onOpen,
  showActions,
}: {
  docs: SavedDocument[];
  onOpen: (d: SavedDocument) => void;
  showActions?: boolean;
}) {
  if (!docs.length) {
    return (
      <div className="bg-card rounded-xl border border-border p-10 text-center">
        <p className="text-sm font-semibold" style={{ color: "#1C2340" }}>Aucun document généré</p>
        <p className="text-sm text-muted-foreground mt-2">Exportez un modèle depuis l’éditeur pour le retrouver ici.</p>
      </div>
    );
  }
  return (
    <div>
      {!showActions && (
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 600, color: "#1C2340", marginBottom: "1rem" }}>
          Documents récents
        </h2>
      )}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(28,35,64,0.05)" }}>
              {(showActions ? ["Document", "Type", "Destinataire", "Date", "Statut", ""] : ["Document", "Type", "Destinataire", "Date", "Statut"]).map((h) => (
                <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#bbb", fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => (
              <tr
                key={doc.id}
                onClick={() => onOpen(doc)}
                className="hover:bg-muted cursor-pointer transition-colors"
                style={{ borderBottom: i < docs.length - 1 ? "1px solid rgba(28,35,64,0.04)" : "none" }}
              >
                <td className="px-5 py-3.5" style={{ fontWeight: 600, fontSize: "0.83rem", color: "#1C2340" }}>
                  {doc.name}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(28,35,64,0.06)", color: "#555" }}>
                    {doc.templateName}
                  </span>
                </td>
                <td className="px-5 py-3.5" style={{ fontSize: "0.83rem", color: "#666" }}>
                  {doc.recipient}
                </td>
                <td className="px-5 py-3.5" style={{ fontSize: "0.78rem", color: "#aaa", fontFamily: "'DM Mono', monospace" }}>
                  {doc.date}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: statusColor(doc.status) + "18", color: statusColor(doc.status) }}>
                    {doc.status}
                  </span>
                </td>
                {showActions && (
                  <td className="px-5 py-3.5">
                    <Download size={13} className="text-muted-foreground" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organismes, setOrganismes] = useState<Organisme[]>([]);
  const [allDocuments, setAllDocuments] = useState<SavedDocument[]>([]);
  const [allTemplates, setAllTemplates] = useState<DocTemplate[]>([]);
  const [allExpenseMonths, setAllExpenseMonths] = useState<ExpenseMonth[]>([]);
  const [allRentalMonths, setAllRentalMonths] = useState<RentalMonth[]>([]);
  const [sessionUser, setSessionUser] = useState<User | null>(null);

  const applyBootstrap = (data: BootstrapData) => {
    setSessionUser(data.user);
    setProfiles(data.profiles);
    setUsers(data.users);
    setOrganismes(data.organismes);
    setAllDocuments(data.documents);
    setAllTemplates(data.templates);
    setAllExpenseMonths(data.expenseMonths);
    setAllRentalMonths(data.rentalMonths || []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await tryRestoreSession();
        if (user && !cancelled) {
          const data = await fetchBootstrap();
          if (!cancelled) applyBootstrap(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setBootError("Impossible de joindre l'API. Vérifiez que PostgreSQL et le serveur backend sont démarrés.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistProfiles = (organismeId: string, nextOrgProfiles: Profile[]) => {
    setProfiles((prev) => {
      const others = prev.filter((p) => p.organismeId !== organismeId);
      const next = [...nextOrgProfiles.map((p) => ({ ...p, organismeId })), ...others];
      void saveProfiles(organismeId, nextOrgProfiles)
        .then((savedOrg) => {
          setProfiles((current) => {
            const rest = current.filter((p) => p.organismeId !== organismeId);
            const merged = [...rest, ...savedOrg];
            setUsers((prevUsers) => prevUsers.map((u) => syncUserRole(u, merged)));
            return merged;
          });
        })
        .catch((err) => {
          console.error(err);
        });
      return next;
    });
  };

  const persistUsers = (next: User[]): Promise<void> => {
    setUsers(next);
    return saveAppUsers(next)
      .then((saved) => {
        setUsers(saved);
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };

  const persistOrganismes = (next: OrganismesUpdater): Promise<void> => {
    let resolved: Organisme[] = [];
    setOrganismes((prev) => {
      resolved = typeof next === "function" ? next(prev) : next;
      return resolved;
    });
    return saveOrganismes(resolved)
      .then(({ organismes: saved, profiles: freshProfiles }) => {
        setOrganismes(saved);
        if (freshProfiles?.length) setProfiles(freshProfiles);
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            const org = saved.find((o) => o.id === u.organismeId);
            return org ? applyOrganisme(u, org) : u;
          })
        );
        if (sessionUser) {
          const org = saved.find((o) => o.id === sessionUser.organismeId);
          if (org) setSessionUser(applyOrganisme(sessionUser, org));
        }
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };

  const user = sessionUser
    ? applyOrganisme(syncUserRole(sessionUser, profiles), findOrganisme(organismes, sessionUser.organismeId))
    : null;

  if (isMobile) {
    return <MobileBlockedPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F6F2", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="text-center">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#1C2340" }}>DocForge</div>
          <p className="mt-3 text-sm" style={{ color: "#888" }}>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        bootError={bootError}
        onLogin={async () => {
          const data = await fetchBootstrap();
          applyBootstrap(data);
          setBootError(null);
        }}
      />
    );
  }

  return (
    <OrganismeProvider user={user} organismes={organismes} onOrganismesChange={persistOrganismes}>
      <Workspace
        user={user}
        profiles={profiles}
        users={users}
        organismes={organismes}
        allDocuments={allDocuments}
        setAllDocuments={setAllDocuments}
        allTemplates={allTemplates}
        setAllTemplates={setAllTemplates}
        allExpenseMonths={allExpenseMonths}
        setAllExpenseMonths={setAllExpenseMonths}
        allRentalMonths={allRentalMonths}
        setAllRentalMonths={setAllRentalMonths}
        onOrganismesChange={persistOrganismes}
        onProfilesChange={persistProfiles}
        onUsersChange={persistUsers}
        onLogout={() => {
          void logoutUser().finally(() => {
            setSessionUser(null);
            setProfiles([]);
            setUsers([]);
            setOrganismes([]);
            setAllDocuments([]);
            setAllTemplates([]);
            setAllExpenseMonths([]);
            setAllRentalMonths([]);
          });
        }}
      />
    </OrganismeProvider>
  );
}
