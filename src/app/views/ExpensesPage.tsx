import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Download, Eye, File, Lock, Plus, Trash2, Wallet, X } from "lucide-react";
import type { ExpenseLine, ExpenseMonth, User } from "../lib/types";
import {
  currentYearMonth,
  emptyMonth,
  expenseTotals,
  isFutureMonth,
  isPastMonth,
  monthBounds,
  monthKey,
  monthLabel,
  monthName,
  newExpenseLine,
  selectableMonths,
} from "../lib/expenses";
import { formatMoney } from "../lib/helpers";
import { useOrganisme } from "../lib/settings";
import { downloadPreviewDoc, exportPreviewPdf } from "../lib/export";
import { ExpensePreview } from "../previews/ExpensePreview";

const cellInp =
  "w-full min-w-0 bg-transparent px-0.5 py-0.5 text-[11px] leading-tight outline-none focus:bg-white focus:ring-1 focus:ring-ring rounded";

export function ExpensesPage({
  user,
  allMonths,
  onPersist,
}: {
  user: User;
  allMonths: ExpenseMonth[];
  onPersist: (update: (orgMonths: ExpenseMonth[]) => ExpenseMonth[]) => void;
}) {
  const { currency } = useOrganisme();
  const money = (n: number) => formatMoney(n, currency);
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const orgId = user.organismeId;
  const months = useMemo(
    () => allMonths.filter((m) => !m.organismeId || m.organismeId === orgId),
    [allMonths, orgId]
  );

  const now = currentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const key = monthKey(year, month);

  const upsertMonth = (build: (current: ExpenseMonth) => ExpenseMonth) => {
    onPersist((orgMonths) => {
      const current = orgMonths.find((m) => m.id === key) ?? emptyMonth(year, month, orgId);
      const patch = { ...build(current), updatedAt: new Date().toISOString() };
      const rest = orgMonths.filter((m) => m.id !== patch.id);
      return [patch, ...rest];
    });
  };

  const [bootstrapped, setBootstrapped] = useState(false);
  useEffect(() => {
    if (bootstrapped) return;
    const monthId = monthKey(now.year, now.month);
    if (!months.some((m) => m.id === monthId)) {
      onPersist((orgMonths) => [emptyMonth(now.year, now.month, orgId), ...orgMonths]);
    }
    setBootstrapped(true);
  }, [bootstrapped, months, now.month, now.year, onPersist, orgId]);

  const current = months.find((m) => m.id === key) ?? emptyMonth(year, month, orgId);
  const past = isPastMonth(year, month);
  const future = isFutureMonth(year, month);
  const sealed = current.sealed || past;
  const locked = sealed || future;
  const totals = expenseTotals(current.lines);
  const bounds = monthBounds(year, month);
  const choices = useMemo(() => selectableMonths(months), [months]);
  const years = useMemo(() => {
    const set = new Set<number>();
    for (let y = now.year; y >= now.year - 6; y--) set.add(y);
    months.forEach((m) => set.add(m.year));
    return [...set].sort((a, b) => b - a);
  }, [months, now.year]);

  const addLine = () => {
    if (locked) return;
    upsertMonth((cur) => {
      const line = newExpenseLine(cur.lines);
      return { ...cur, sealed: false, lines: [...cur.lines, line] };
    });
  };

  const updateLine = (id: string, patch: Partial<ExpenseLine>) => {
    if (locked) return;
    upsertMonth((cur) => ({
      ...cur,
      sealed: false,
      lines: cur.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const removeLine = (id: string) => {
    if (locked) return;
    upsertMonth((cur) => ({
      ...cur,
      sealed: false,
      lines: cur.lines.filter((l) => l.id !== id),
    }));
  };

  const sealMonth = () => {
    if (sealed || !current.lines.length) return;
    if (!confirm(`Clôturer le suivi de ${monthLabel(year, month)} ? Plus aucune ligne ne pourra être ajoutée ni retirée.`)) return;
    upsertMonth((cur) => ({ ...cur, sealed: true, sealedAt: new Date().toISOString() }));
  };

  const th = "text-left px-1 py-1.5 font-semibold whitespace-nowrap";
  const td = "px-1 py-0.5 align-middle";

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden" style={{ fontSize: 12 }}>
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "#1C2340", lineHeight: 1.2 }}>
              Suivi des dépenses
            </h1>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: sealed ? "rgba(192,57,43,0.12)" : "rgba(44,95,46,0.12)",
                color: sealed ? "#C0392B" : "#2C5F2E",
              }}
            >
              {sealed ? <Lock size={9} /> : <Wallet size={9} />}
              {sealed ? "Clôturé" : future ? "À venir" : "Ouvert"}
            </span>
            <span className="text-[11px] font-medium" style={{ color: "#888" }}>
              {monthLabel(year, month)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              className="rounded-md border border-border bg-white px-2 py-1 text-[11px]"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              aria-label="Mois"
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
              aria-label="Année"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {!locked && (
              <>
                <button
                  onClick={addLine}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white"
                  style={{ background: "#B8923A" }}
                >
                  <Plus size={12} />
                  Ligne
                </button>
                {current.lines.length > 0 && (
                  <button
                    onClick={sealMonth}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border"
                    style={{ color: "#1C2340" }}
                  >
                    <Lock size={11} />
                    Clôturer
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border"
              style={{ color: "#1C2340" }}
            >
              <Eye size={12} />
              Aperçu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          <StatCard label="Lignes" value={String(totals.count)} />
          <StatCard label="Entrées" value={money(totals.entree)} accent="#2C5F2E" />
          <StatCard label="Dépenses" value={money(totals.montant)} accent="#C0392B" />
          <StatCard label="Solde" value={money(totals.solde)} accent={totals.solde >= 0 ? "#1C2340" : "#C0392B"} />
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-4 flex gap-3">
        <div className="flex-1 min-w-0 min-h-0 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "3%" }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(28,35,64,0.08)" }}>
                  {["Item", "Libellé dépense", "Code reçu", "Date", "Entrée", "Montant", "Observation", ""].map((h) => (
                    <th
                      key={h || "act"}
                      className={th}
                      style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#aaa" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.lines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-[11px]" style={{ color: "#999" }}>
                      {sealed
                        ? "Aucun suivi enregistré pour ce mois."
                        : "Aucune ligne. Ajoutez une dépense : la date du jour est renseignée automatiquement."}
                    </td>
                  </tr>
                ) : (
                  current.lines.map((line, i) => (
                    <tr
                      key={line.id}
                      style={{ borderBottom: i < current.lines.length - 1 ? "1px solid rgba(28,35,64,0.05)" : "none" }}
                    >
                      <td className={td}>
                        <Field value={line.item} disabled={locked} onChange={(v) => updateLine(line.id, { item: v })} />
                      </td>
                      <td className={td}>
                        <Field
                          value={line.libelle}
                          disabled={locked}
                          placeholder="Libellé dépense"
                          onChange={(v) => updateLine(line.id, { libelle: v })}
                        />
                      </td>
                      <td className={td}>
                        <Field value={line.codeRecu} disabled={locked} placeholder="N°" onChange={(v) => updateLine(line.id, { codeRecu: v })} />
                      </td>
                      <td className={td}>
                        <input
                          type="date"
                          className={cellInp}
                          disabled={locked}
                          min={bounds.min}
                          max={bounds.max}
                          value={line.date}
                          onChange={(e) => updateLine(line.id, { date: e.target.value })}
                        />
                      </td>
                      <td className={td}>
                        {sealed ? (
                          <span className="block text-right text-[11px] truncate px-0.5" style={{ color: "#2C5F2E", fontFamily: "'DM Mono', monospace" }}>
                            {money(line.entree)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={`${cellInp} text-right`}
                            style={{ fontFamily: "'DM Mono', monospace" }}
                            value={line.entree || ""}
                            onChange={(e) => updateLine(line.id, { entree: e.target.value === "" ? 0 : Number(e.target.value) })}
                          />
                        )}
                      </td>
                      <td className={td}>
                        {sealed ? (
                          <span className="block text-right text-[11px] truncate px-0.5" style={{ color: "#C0392B", fontFamily: "'DM Mono', monospace" }}>
                            {money(line.montant)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={`${cellInp} text-right`}
                            style={{ fontFamily: "'DM Mono', monospace" }}
                            value={line.montant || ""}
                            onChange={(e) => updateLine(line.id, { montant: e.target.value === "" ? 0 : Number(e.target.value) })}
                          />
                        )}
                      </td>
                      <td className={td}>
                        <Field value={line.observation} disabled={locked} placeholder="Note" onChange={(v) => updateLine(line.id, { observation: v })} />
                      </td>
                      <td className={`${td} text-center`}>
                        {!locked && (
                          <button className="p-0.5 text-muted-foreground hover:text-destructive" onClick={() => removeLine(line.id)}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {current.lines.length > 0 && (
                <tfoot>
                  <tr style={{ background: "rgba(28,35,64,0.04)" }}>
                    <td colSpan={4} className="px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#888" }}>
                      Totaux
                    </td>
                    <td className="px-1 py-1.5 text-[11px] font-semibold text-right truncate" style={{ color: "#2C5F2E", fontFamily: "'DM Mono', monospace" }}>
                      {money(totals.entree)}
                    </td>
                    <td className="px-1 py-1.5 text-[11px] font-semibold text-right truncate" style={{ color: "#C0392B", fontFamily: "'DM Mono', monospace" }}>
                      {money(totals.montant)}
                    </td>
                    <td colSpan={2} className="px-1 py-1.5 text-[11px] font-semibold truncate" style={{ color: "#1C2340", fontFamily: "'DM Mono', monospace" }}>
                      {money(totals.solde)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <aside className="w-40 flex-shrink-0 min-h-0 hidden xl:flex">
          <div className="h-full w-full rounded-lg border border-border bg-card p-2 flex flex-col">
            <div className="text-[9px] uppercase tracking-wider font-semibold px-1.5 mb-1 flex-shrink-0" style={{ color: "#aaa" }}>
              Mois
            </div>
            <div className="flex-1 min-h-0 overflow-auto space-y-0.5">
              {choices.map((c) => {
                const rec = months.find((m) => m.id === monthKey(c.year, c.month));
                const t = expenseTotals(rec?.lines || []);
                const monthLocked = rec?.sealed || isPastMonth(c.year, c.month);
                const active = c.year === year && c.month === month;
                return (
                  <button
                    key={`${c.year}-${c.month}`}
                    onClick={() => {
                      setYear(c.year);
                      setMonth(c.month);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-md"
                    style={{ background: active ? "rgba(28,35,64,0.08)" : "transparent" }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold truncate" style={{ color: "#1C2340" }}>
                        {monthName(c.month)} {String(c.year).slice(2)}
                      </span>
                      {monthLocked ? <Lock size={9} style={{ color: "#bbb" }} /> : null}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: "#888", fontFamily: "'DM Mono', monospace" }}>
                      {t.count} · {money(t.solde)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(28,35,64,0.55)" }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border flex-shrink-0">
              <div className="min-w-0">
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1C2340", fontSize: "1.05rem" }}>
                  Aperçu du document
                </div>
                <div className="text-[11px] truncate" style={{ color: "#999" }}>
                  {monthLabel(year, month)}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <IconAction
                  label="PDF"
                  color="#C0392B"
                  onClick={() =>
                    exportPreviewPdf(`Suivi des dépenses ${monthLabel(year, month)}`, previewRef.current)
                  }
                >
                  <File size={18} strokeWidth={1.75} />
                </IconAction>
                <IconAction
                  label="Télécharger"
                  color="#1C2340"
                  onClick={() =>
                    downloadPreviewDoc(`Suivi des dépenses ${monthLabel(year, month)}`, previewRef.current)
                  }
                >
                  <Download size={18} strokeWidth={1.75} />
                </IconAction>
                <button
                  onClick={() => setShowPreview(false)}
                  className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-5" style={{ background: "#EDEBE6" }}>
              <div ref={previewRef} className="max-w-[210mm] mx-auto">
                <ExpensePreview
                  user={user}
                  year={year}
                  month={month}
                  lines={current.lines}
                  sealed={sealed}
                  currency={currency}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconAction({
  label,
  color,
  onClick,
  children,
}: {
  label: string;
  color: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 min-w-[52px] group">
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 group-active:scale-95"
        style={{ background: color }}
      >
        {children}
      </span>
      <span className="text-[10px] font-semibold" style={{ color: "#1C2340" }}>
        {label}
      </span>
    </button>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 min-w-0">
      <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "#aaa" }}>
        {label}
      </div>
      <div className="truncate" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", color: accent || "#1C2340" }}>
        {value}
      </div>
    </div>
  );
}

function Field({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  if (disabled) {
    return (
      <span className="block text-[11px] truncate px-0.5" style={{ color: "#1C2340" }} title={value}>
        {value || "—"}
      </span>
    );
  }
  return (
    <input className={cellInp} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}
