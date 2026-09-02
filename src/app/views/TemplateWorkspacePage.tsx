import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Eye, File, FileSpreadsheet, FileText, Plus, Save, Trash2 } from "lucide-react";
import type { DocData, DocTemplate, ExportFormat, SavedDocument, User } from "../lib/types";
import { DocumentForm, type DocFormChangeOptions } from "../editor/DocumentForm";
import { DocumentPreview } from "../previews/DocumentPreview";
import { PreviewModal } from "../components/PreviewModal";
import {
  currentYearMonth,
  isPastMonth,
  monthKey,
  monthLabel,
  monthName,
} from "../lib/expenses";
import {
  freshDocData,
  matchesMonth,
  newSavedDocument,
  patchSavedDocument,
  selectableDocMonths,
  docYearMonth as getDocYearMonth,
} from "../lib/documents";
import { documentTitle } from "../lib/templates";
import { exportDocument } from "../lib/export";
import { useOrganisme } from "../lib/settings";
import { statusColor } from "../lib/helpers";
import { withOrganismeHeader } from "../lib/organismeHeader";

type DocPersistInput = SavedDocument[] | ((orgDocs: SavedDocument[]) => SavedDocument[]);
type DocPersistOptions = { immediate?: boolean };

export function TemplateWorkspacePage({
  template,
  user,
  documents,
  onDocumentsChange,
  modelChoices,
  onApplyModel,
  onSaveAsTemplate,
  initialDocId,
  onInitialDocConsumed,
}: {
  template: DocTemplate;
  user: User;
  documents: SavedDocument[];
  onDocumentsChange: (input: DocPersistInput, options?: DocPersistOptions) => void;
  modelChoices: DocTemplate[];
  onApplyModel: (id: string) => void;
  onSaveAsTemplate?: (data: DocData) => void;
  initialDocId?: string | null;
  onInitialDocConsumed?: () => void;
}) {
  const { currency } = useOrganisme();
  const now = currentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [data, setData] = useState<DocData>({});
  const [showPreview, setShowPreview] = useState(false);
  const [exported, setExported] = useState<ExportFormat | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const dataRef = useRef<DocData>({});

  activeIdRef.current = activeId;
  dataRef.current = data;

  const templateDocs = useMemo(
    () => documents.filter((d) => d.templateId === template.id && d.authorId === user.id),
    [documents, template.id, user.id]
  );

  const monthDocs = useMemo(
    () => templateDocs.filter((d) => matchesMonth(d, year, month)).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
    [templateDocs, year, month]
  );

  const choices = useMemo(() => selectableDocMonths(templateDocs, template.id), [templateDocs, template.id]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (let y = now.year; y >= now.year - 6; y--) set.add(y);
    templateDocs.forEach((d) => set.add(getDocYearMonth(d).year));
    return [...set].sort((a, b) => b - a);
  }, [templateDocs, now.year]);

  const active = monthDocs.find((d) => d.id === activeId) ?? null;

  const commitSave = useCallback(
    (nextData: DocData, immediate = false) => {
      const merged = withOrganismeHeader(nextData, user);
      setData(merged);
      dataRef.current = merged;

      const run = (immediateSave = false) => {
        const id = activeIdRef.current;
        if (!id) return;
        onDocumentsChange(
          (orgDocs) => orgDocs.map((d) => (d.id === id ? patchSavedDocument(d, template, merged) : d)),
          immediateSave ? { immediate: true } : undefined
        );
      };

      if (immediate) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        run(true);
        return;
      }

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => run(false), 400);
    },
    [onDocumentsChange, template, user]
  );

  useEffect(() => {
    setActiveId(null);
  }, [template.id]);

  useEffect(() => {
    if (!initialDocId) return;
    const doc = templateDocs.find((d) => d.id === initialDocId);
    if (!doc) {
      onInitialDocConsumed?.();
      return;
    }
    const { year: y, month: m } = getDocYearMonth(doc);
    setYear(y);
    setMonth(m);
    setActiveId(doc.id);
    onInitialDocConsumed?.();
  }, [initialDocId, templateDocs, onInitialDocConsumed]);

  useEffect(() => {
    if (initialDocId) return;
    if (activeId && monthDocs.some((d) => d.id === activeId)) return;
    setActiveId(monthDocs[0]?.id ?? null);
  }, [monthDocs, activeId, year, month, initialDocId]);

  useEffect(() => {
    if (active) setData(withOrganismeHeader(active.data, user));
    else setData({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resync header when org identity changes
  }, [active?.id, user.company, user.companyAddress, user.companyEmail, user.companyPhone, user.companyLogo]);

  const scheduleSave = (nextData: DocData, opts?: DocFormChangeOptions) => {
    commitSave(nextData, !!opts?.immediate);
  };

  const createDoc = () => {
    const fresh = freshDocData(template, user, currency, year, month);
    const doc = newSavedDocument(template, user, fresh, year, month);
    onDocumentsChange((orgDocs) => [doc, ...orgDocs], { immediate: true });
    setActiveId(doc.id);
    setData(fresh);
    dataRef.current = fresh;
  };

  const removeDoc = (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    onDocumentsChange((orgDocs) => orgDocs.filter((d) => d.id !== id), { immediate: true });
    if (activeId === id) setActiveId(null);
  };

  const handleExport = (fmt: ExportFormat) => {
    if (!active) return;
    exportDocument(fmt, documentTitle(template, data), previewRef.current, template, { ...withOrganismeHeader(data, user), currency });
    onDocumentsChange(
      (orgDocs) =>
        orgDocs.map((d) =>
          d.id === active.id
            ? { ...patchSavedDocument(d, template, withOrganismeHeader(data, user)), status: "Finalisé" }
            : d
        ),
      { immediate: true }
    );
    setExported(fmt);
    setTimeout(() => setExported(null), 2800);
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden" style={{ fontSize: 12 }}>
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span style={{ fontSize: "1.1rem" }}>{template.icon}</span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "#1C2340" }}>
              {template.name}
            </h1>
            <span className="text-[10px]" style={{ color: "#888" }}>
              {monthLabel(year, month)} · {monthDocs.length} doc.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              className="rounded-md border border-border bg-white px-2 py-1 text-[11px]"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {monthName(m)}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-border bg-white px-2 py-1 text-[11px]"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {modelChoices.length > 1 && (
              <select
                value={template.id}
                onChange={(e) => onApplyModel(e.target.value)}
                className="text-[11px] rounded-md border border-border bg-white px-2 py-1 max-w-[140px]"
              >
                {modelChoices.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.builtin ? m.name : m.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={createDoc}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white"
              style={{ background: "#B8923A" }}
            >
              <Plus size={12} />
              Nouveau
            </button>
            {onSaveAsTemplate && active && (
              <button
                onClick={() => onSaveAsTemplate(data)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border"
                style={{ color: "#1C2340" }}
              >
                <Save size={11} />
                Modèle
              </button>
            )}
            <button
              onClick={() => active && setShowPreview(true)}
              disabled={!active}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border disabled:opacity-40"
              style={{ color: "#1C2340" }}
            >
              <Eye size={12} />
              Aperçu
            </button>
            {exported ? (
              <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-semibold" style={{ background: "#2C5F2E18", color: "#2C5F2E" }}>
                <CheckCircle2 size={12} />
                {exported.toUpperCase()}
              </span>
            ) : active ? (
              <>
                <ExportBtn format="excel" icon={<FileSpreadsheet size={12} />} onClick={() => handleExport("excel")} />
                <ExportBtn format="word" icon={<FileText size={12} />} onClick={() => handleExport("word")} />
                <ExportBtn format="pdf" icon={<File size={12} />} onClick={() => handleExport("pdf")} />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-2 px-4 py-3 overflow-hidden">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2 overflow-hidden">
          <div className="flex-shrink-0 rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(28,35,64,0.06)" }}>
                  {["Document", "Destinataire", "Statut", ""].map((h) => (
                    <th
                      key={h || "a"}
                      className="text-left px-2 py-1.5"
                      style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#aaa" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthDocs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-[11px]" style={{ color: "#999" }}>
                      Aucun document pour ce mois. Cliquez sur « Nouveau » pour en créer un — l’enregistrement est automatique.
                    </td>
                  </tr>
                ) : (
                  monthDocs.map((doc, i) => {
                    const selected = doc.id === activeId;
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setActiveId(doc.id)}
                        className="cursor-pointer hover:bg-muted/50"
                        style={{
                          borderBottom: i < monthDocs.length - 1 ? "1px solid rgba(28,35,64,0.04)" : "none",
                          background: selected ? "rgba(28,35,64,0.05)" : "transparent",
                        }}
                      >
                        <td className="px-2 py-1.5 text-[11px] font-semibold truncate max-w-[180px]" style={{ color: "#1C2340" }}>
                          {doc.name}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] truncate max-w-[120px]" style={{ color: "#666" }}>
                          {doc.recipient}
                        </td>
                        <td className="px-2 py-1.5">
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: statusColor(doc.status) + "18", color: statusColor(doc.status) }}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            className="p-0.5 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDoc(doc.id);
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-card p-3">
            {active ? (
              <DocumentForm template={template} data={data} onChange={scheduleSave} compact />
            ) : (
              <div className="h-full flex items-center justify-center text-[11px]" style={{ color: "#999" }}>
                Sélectionnez un document ou créez-en un nouveau.
              </div>
            )}
          </div>
        </div>

        <aside className="w-36 flex-shrink-0 min-h-0 hidden lg:flex">
          <div className="h-full w-full rounded-lg border border-border bg-card p-2 flex flex-col">
            <div className="text-[9px] uppercase tracking-wider font-semibold px-1 mb-1 flex-shrink-0" style={{ color: "#aaa" }}>
              Mois
            </div>
            <div className="flex-1 min-h-0 overflow-auto space-y-0.5">
              {choices.map((c) => {
                const count = templateDocs.filter((d) => matchesMonth(d, c.year, c.month)).length;
                const activeMonth = c.year === year && c.month === month;
                const past = isPastMonth(c.year, c.month);
                return (
                  <button
                    key={`${c.year}-${c.month}`}
                    onClick={() => {
                      setYear(c.year);
                      setMonth(c.month);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-md"
                    style={{ background: activeMonth ? "rgba(28,35,64,0.08)" : "transparent" }}
                  >
                    <div className="text-[11px] font-semibold truncate" style={{ color: past ? "#888" : "#1C2340" }}>
                      {monthName(c.month)} {String(c.year).slice(2)}
                    </div>
                    <div className="text-[10px]" style={{ color: "#aaa" }}>
                      {count} doc.
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {showPreview && active && (
        <PreviewModal
          title="Aperçu du document"
          subtitle={`${template.name} · ${monthLabel(year, month)}`}
          exportName={documentTitle(template, data)}
          onClose={() => setShowPreview(false)}
        >
          <DocumentPreview template={template} data={withOrganismeHeader(data, user)} currency={currency} />
        </PreviewModal>
      )}
      {active && (
        <div className="hidden" aria-hidden>
          <div ref={previewRef}>
            <DocumentPreview template={template} data={withOrganismeHeader(data, user)} currency={currency} />
          </div>
        </div>
      )}
    </div>
  );
}

function ExportBtn({ format, icon, onClick }: { format: ExportFormat; icon: React.ReactNode; onClick: () => void }) {
  const bg = format === "pdf" ? "#C0392B" : format === "excel" ? "#1D6F42" : "#2B579A";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white hover:brightness-110"
      style={{ background: bg }}
    >
      {icon}
      {format.toUpperCase()}
    </button>
  );
}
