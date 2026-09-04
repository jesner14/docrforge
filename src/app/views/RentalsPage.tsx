import { useMemo, useRef, useState } from "react";
import { Car, Eye, Lock, Plus, Trash2 } from "lucide-react";
import type { RentalLine, RentalMonth, User } from "../lib/types";
import {
  currentYearMonth,
  resolveDateRemiseCaisse,
  deriveRentalStatus,
  emptyRentalMonth,
  findRentalMonth,
  isFutureMonth,
  monthBounds,
  monthLabel,
  monthName,
  newRentalLine,
  rentalEcart,
  rentalMonthId,
  PROLONGEMENT_STATUSES,
  prolongementStatusColor,
  RENTAL_PAYMENT_MODES,
  RENTAL_STATUSES,
  rentalTotals,
  selectableRentalMonths,
  statusColor,
} from "../lib/rentals";
import { formatMoney } from "../lib/helpers";
import { useOrganisme } from "../lib/settings";
import { downloadPreviewDoc, exportPreviewPdf } from "../lib/export";
import { RentalPreview } from "../previews/RentalPreview";

const cellInp =
  "w-full min-w-0 bg-transparent px-0.5 py-0.5 text-[11px] leading-tight outline-none focus:bg-white focus:ring-1 focus:ring-ring rounded";

export function RentalsPage({
  user,
  allMonths,
  onPersist,
}: {
  user: User;
  allMonths: RentalMonth[];
  onPersist: (update: (orgMonths: RentalMonth[]) => RentalMonth[], options?: { immediate?: boolean }) => void;
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

  const upsertMonth = (
    build: (current: RentalMonth) => RentalMonth,
    options?: { immediate?: boolean }
  ) => {
    onPersist((orgMonths) => {
      const current =
        findRentalMonth(orgMonths, year, month, orgId) ?? emptyRentalMonth(year, month, orgId);
      const patch = {
        ...build(current),
        id: rentalMonthId(orgId, year, month),
        year,
        month,
        organismeId: orgId,
        updatedAt: new Date().toISOString(),
      };
      const rest = orgMonths.filter(
        (m) => !(m.year === year && m.month === month && (!m.organismeId || m.organismeId === orgId))
      );
      return [patch, ...rest];
    }, options);
  };

  const current = findRentalMonth(months, year, month, orgId) ?? emptyRentalMonth(year, month, orgId);
  const future = isFutureMonth(year, month);
  const sealed = !!current.sealed;
  const locked = sealed || future;
  const totals = rentalTotals(current.lines);
  const bounds = monthBounds(year, month);
  const choices = useMemo(() => selectableRentalMonths(months), [months]);
  const years = useMemo(() => {
    const set = new Set<number>();
    for (let y = now.year + 1; y >= now.year - 5; y--) set.add(y);
    months.forEach((m) => set.add(m.year));
    return [...set].sort((a, b) => b - a);
  }, [months, now.year]);

  const addLine = () => {
    if (locked) return;
    upsertMonth((cur) => {
      const line = newRentalLine(cur.lines);
      return { ...cur, sealed: false, lines: [...cur.lines, line] };
    });
  };

  const updateLine = (id: string, patch: Partial<RentalLine>) => {
    if (locked) return;
    upsertMonth((cur) => ({
      ...cur,
      lines: cur.lines.map((l) => {
        if (l.id !== id || l.sealed) return l;
        const next = { ...l, ...patch };
        if ("montantAPayer" in patch || "montantEncaisse" in patch) {
          next.statut = deriveRentalStatus(next);
        }
        return next;
      }),
    }));
  };

  const removeLine = (id: string) => {
    if (locked) return;
    const target = current.lines.find((l) => l.id === id);
    if (target?.sealed) return;
    if (!confirm("Supprimer cette location ?")) return;
    upsertMonth((cur) => ({
      ...cur,
      lines: cur.lines.filter((l) => l.id !== id),
    }), { immediate: true });
  };

  const sealLine = (id: string) => {
    if (locked) return;
    const target = current.lines.find((l) => l.id === id);
    if (!target || target.sealed) return;
    if (!confirm("Clôturer cette location ? Elle sera enregistrée et ne pourra plus être modifiée.")) return;
    upsertMonth(
      (cur) => ({
        ...cur,
        lines: cur.lines.map((l) =>
          l.id === id ? { ...l, sealed: true, sealedAt: new Date().toISOString() } : l
        ),
      }),
      { immediate: true }
    );
  };

  const sealMonth = () => {
    if (sealed || !current.lines.length) return;
    if (!confirm(`Clôturer toutes les locations de ${monthLabel(year, month)} ? Plus aucune ligne ne pourra être modifiée.`)) return;
    upsertMonth(
      (cur) => ({
        ...cur,
        sealed: true,
        sealedAt: new Date().toISOString(),
        lines: cur.lines.map((l) =>
          l.sealed ? l : { ...l, sealed: true, sealedAt: new Date().toISOString() }
        ),
      }),
      { immediate: true }
    );
  };

  const unsealMonth = () => {
    if (!sealed || future) return;
    if (!confirm(`Rouvrir ${monthLabel(year, month)} pour saisie ? Les lignes déjà clôturées individuellement resteront verrouillées.`)) return;
    upsertMonth(
      (cur) => ({
        ...cur,
        sealed: false,
        sealedAt: undefined,
      }),
      { immediate: true }
    );
  };

  const th = "text-left px-1 py-1.5 font-semibold whitespace-nowrap";
  const td = "px-1 py-0.5 align-middle";

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden" style={{ fontSize: 12 }}>
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "#1C2340", lineHeight: 1.2 }}>
              Suivi des locations
            </h1>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: sealed ? "rgba(192,57,43,0.12)" : "rgba(44,95,46,0.12)",
                color: sealed ? "#C0392B" : "#2C5F2E",
              }}
            >
              {sealed ? <Lock size={9} /> : <Car size={9} />}
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
            {!locked && (
              <>
                <button
                  onClick={addLine}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white"
                  style={{ background: "#B8923A" }}
                >
                  <Plus size={12} />
                  Location
                </button>
                {current.lines.length > 0 && (
                  <button
                    onClick={sealMonth}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border"
                    style={{ color: "#1C2340" }}
                  >
                    <Lock size={11} />
                    Clôturer le mois
                  </button>
                )}
              </>
            )}
            {sealed && !future && (
              <button
                onClick={unsealMonth}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border"
                style={{ color: "#1C2340" }}
              >
                <Car size={11} />
                Rouvrir le mois
              </button>
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

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          <StatCard label="Locations" value={String(totals.count)} />
          <StatCard label="Jours" value={String(totals.jours)} />
          <StatCard label="À payer" value={money(totals.aPayer)} accent="#1C2340" />
          <StatCard label="Encaissé" value={money(totals.encaisse)} accent="#2C5F2E" />
          <StatCard label="Écart" value={money(totals.ecart)} accent={totals.ecart > 0 ? "#C0392B" : "#2C5F2E"} />
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-4 flex gap-3">
        <div className="flex-1 min-w-0 min-h-0 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full" style={{ minWidth: 1480, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(28,35,64,0.08)", background: "#F7F6F2" }}>
                  {[
                    "N°",
                    "Date",
                    "Client",
                    "Véhicule",
                    "Immatriculation",
                    "Jours",
                    "À payer",
                    "Encaissé",
                    "Livreur",
                    "Date remise caisse",
                    "Écart",
                    "Statut location",
                    "Nb prolongements",
                    "Statut prolongement",
                    "Montant prolongement encaissé",
                    "Paiement",
                    "Observation",
                    "Actions",
                  ].map((h) => (
                    <th key={h || "x"} className={th} style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#888" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.lines.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="px-4 py-10 text-center text-[11px]" style={{ color: "#999" }}>
                      Aucune location ce mois. Cliquez sur « Location » pour ajouter une ligne.
                    </td>
                  </tr>
                ) : (
                  current.lines.map((line, i) => {
                    const ecart = rentalEcart(line);
                    const lineLocked = locked || !!line.sealed;
                    return (
                      <tr
                        key={line.id}
                        style={{
                          borderBottom: i < current.lines.length - 1 ? "1px solid rgba(28,35,64,0.04)" : "none",
                          background: line.sealed ? "rgba(28,35,64,0.03)" : "transparent",
                        }}
                      >
                        <td className={td}>
                          <input className={cellInp} style={{ width: 36 }} value={line.numero} disabled={lineLocked} onChange={(e) => updateLine(line.id, { numero: e.target.value })} />
                        </td>
                        <td className={td}>
                          <input className={cellInp} type="date" min={bounds.min} max={bounds.max} value={line.date} disabled={lineLocked} onChange={(e) => updateLine(line.id, { date: e.target.value })} />
                        </td>
                        <td className={td}>
                          <input className={cellInp} value={line.client} disabled={lineLocked} onChange={(e) => updateLine(line.id, { client: e.target.value })} placeholder="Client" />
                        </td>
                        <td className={td}>
                          <input className={cellInp} value={line.vehicule} disabled={lineLocked} onChange={(e) => updateLine(line.id, { vehicule: e.target.value })} placeholder="Véhicule" />
                        </td>
                        <td className={td}>
                          <input className={cellInp} value={line.immatriculation} disabled={lineLocked} onChange={(e) => updateLine(line.id, { immatriculation: e.target.value })} placeholder="AA-000-AA" />
                        </td>
                        <td className={td}>
                          <input className={cellInp + " text-right"} type="number" min={0} value={line.jours || ""} disabled={lineLocked} onChange={(e) => updateLine(line.id, { jours: parseFloat(e.target.value) || 0 })} />
                        </td>
                        <td className={td}>
                          <input className={cellInp + " text-right"} type="number" min={0} value={line.montantAPayer || ""} disabled={lineLocked} onChange={(e) => updateLine(line.id, { montantAPayer: parseFloat(e.target.value) || 0 })} />
                        </td>
                        <td className={td}>
                          <input className={cellInp + " text-right"} type="number" min={0} value={line.montantEncaisse || ""} disabled={lineLocked} onChange={(e) => updateLine(line.id, { montantEncaisse: parseFloat(e.target.value) || 0 })} />
                        </td>
                        <td className={td}>
                          <input className={cellInp} value={line.livreur} disabled={lineLocked} onChange={(e) => updateLine(line.id, { livreur: e.target.value })} />
                        </td>
                        <td className={td}>
                          <input
                            className={cellInp}
                            type="date"
                            value={resolveDateRemiseCaisse(line)}
                            disabled={lineLocked}
                            onChange={(e) => updateLine(line.id, { dateRemiseCaisse: e.target.value })}
                            title="Date de remise de caisse"
                          />
                        </td>
                        <td className={td}>
                          <div className="text-right px-0.5 font-semibold" style={{ fontFamily: "'DM Mono', monospace", color: ecart > 0 ? "#C0392B" : "#2C5F2E", fontSize: 11 }}>
                            {money(ecart)}
                          </div>
                        </td>
                        <td className={td}>
                          <select
                            className={cellInp}
                            value={line.statut || deriveRentalStatus(line)}
                            disabled={lineLocked}
                            onChange={(e) => updateLine(line.id, { statut: e.target.value as RentalLine["statut"] })}
                            style={{ color: statusColor(line.statut || deriveRentalStatus(line)) }}
                          >
                            {RENTAL_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={td}>
                          <input
                            className={cellInp + " text-right"}
                            type="number"
                            min={0}
                            value={line.nbProlongements || ""}
                            disabled={lineLocked}
                            onChange={(e) => updateLine(line.id, { nbProlongements: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className={td}>
                          <select
                            className={cellInp}
                            value={line.statutProlongement || ""}
                            disabled={lineLocked}
                            onChange={(e) =>
                              updateLine(line.id, {
                                statutProlongement: e.target.value as RentalLine["statutProlongement"],
                              })
                            }
                            style={{ color: prolongementStatusColor(line.statutProlongement || "") }}
                          >
                            <option value="">—</option>
                            {PROLONGEMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={td}>
                          <input
                            className={cellInp + " text-right"}
                            type="number"
                            min={0}
                            value={line.montantProlongementEncaisse || ""}
                            disabled={lineLocked}
                            onChange={(e) =>
                              updateLine(line.id, { montantProlongementEncaisse: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td className={td}>
                          <select className={cellInp} value={line.modePaiement} disabled={lineLocked} onChange={(e) => updateLine(line.id, { modePaiement: e.target.value })}>
                            <option value="">—</option>
                            {RENTAL_PAYMENT_MODES.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={td}>
                          <input className={cellInp} value={line.observation} disabled={lineLocked} onChange={(e) => updateLine(line.id, { observation: e.target.value })} />
                        </td>
                        <td className={td}>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            {line.sealed ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(192,57,43,0.12)", color: "#C0392B" }}
                                title={line.sealedAt ? `Clôturée le ${new Date(line.sealedAt).toLocaleString("fr-FR")}` : "Clôturée"}
                              >
                                <Lock size={9} />
                                Clôturée
                              </span>
                            ) : !locked ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => sealLine(line.id)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-border hover:bg-muted"
                                  style={{ color: "#1C2340" }}
                                  title="Enregistrer et verrouiller cette ligne"
                                >
                                  <Lock size={9} />
                                  Clôturer
                                </button>
                                <button
                                  type="button"
                                  className="p-0.5 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeLine(line.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="w-36 flex-shrink-0 min-h-0 hidden lg:flex">
          <div className="h-full w-full rounded-lg border border-border bg-card p-2 flex flex-col">
            <div className="text-[9px] uppercase tracking-wider font-semibold px-1 mb-1 flex-shrink-0" style={{ color: "#aaa" }}>
              Mois
            </div>
            <div className="flex-1 min-h-0 overflow-auto space-y-0.5">
              {choices.map((c) => {
                const rec = months.find((m) => m.year === c.year && m.month === c.month);
                const count = rec?.lines.length ?? 0;
                const activeMonth = c.year === year && c.month === month;
                const monthSealed = !!rec?.sealed;
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
                    <div className="text-[11px] font-semibold truncate" style={{ color: monthSealed ? "#888" : "#1C2340" }}>
                      {monthName(c.month)} {String(c.year).slice(2)}
                    </div>
                    <div className="text-[10px]" style={{ color: "#aaa" }}>
                      {count} loc.{monthSealed ? " · clôturé" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: "rgba(28,35,64,0.55)" }} onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border flex-shrink-0">
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1C2340", fontSize: "0.95rem" }}>
                  Aperçu — Suivi des locations
                </div>
                <div className="text-[10px]" style={{ color: "#999" }}>
                  {monthLabel(year, month)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-white"
                  style={{ background: "#C0392B" }}
                  onClick={() => void exportPreviewPdf(`Suivi des locations ${monthLabel(year, month)}`, previewRef.current)}
                >
                  PDF
                </button>
                <button
                  className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-white"
                  style={{ background: "#1C2340" }}
                  onClick={() => downloadPreviewDoc(`Suivi des locations ${monthLabel(year, month)}`, previewRef.current)}
                >
                  Word
                </button>
                <button onClick={() => setShowPreview(false)} className="p-1 text-muted-foreground">
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4" style={{ background: "#EDEBE6" }}>
              <div ref={previewRef} className="max-w-[210mm] mx-auto">
                <RentalPreview user={user} year={year} month={month} lines={current.lines} sealed={sealed} currency={currency} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "#aaa" }}>
        {label}
      </div>
      <div className="mt-0.5 font-semibold truncate" style={{ fontFamily: "'DM Mono', monospace", color: accent || "#1C2340", fontSize: "0.95rem" }}>
        {value}
      </div>
    </div>
  );
}
