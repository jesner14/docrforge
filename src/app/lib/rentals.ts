import type { ProlongementStatus, RentalLine, RentalMonth, RentalStatus } from "./types";
import { uid } from "./helpers";
import {
  currentYearMonth,
  isPastMonth,
  monthKey,
  todayIso,
} from "./expenses";

export {
  monthKey,
  monthLabel,
  monthName,
  currentYearMonth,
  isPastMonth,
  isFutureMonth,
  monthBounds,
  todayIso,
} from "./expenses";

export const RENTAL_STATUSES: RentalStatus[] = ["non payé", "partiellement payé", "soldé"];

export const PROLONGEMENT_STATUSES: ProlongementStatus[] = [
  "Encaissé",
  "Non encaissé",
  "Partiellement encaissé",
];

export const RENTAL_PAYMENT_MODES = ["OM", "WAVE", "Espèces", "Virement", "Chèque", "Autre"];

export function rentalEcart(line: Pick<RentalLine, "montantAPayer" | "montantEncaisse">) {
  return (Number(line.montantAPayer) || 0) - (Number(line.montantEncaisse) || 0);
}

export function deriveRentalStatus(line: Pick<RentalLine, "montantAPayer" | "montantEncaisse">): RentalStatus {
  const due = Number(line.montantAPayer) || 0;
  const paid = Number(line.montantEncaisse) || 0;
  if (paid <= 0) return "non payé";
  if (paid + 0.0001 >= due) return "soldé";
  return "partiellement payé";
}

/** Date de remise de caisse (manuel), avec secours sur l’ancien champ. */
export function resolveDateRemiseCaisse(line: Pick<RentalLine, "dateRemiseCaisse" | "dateRemiseVehicule">) {
  return line.dateRemiseCaisse || line.dateRemiseVehicule || "";
}

export function rentalMonthId(organismeId: string | undefined, year: number, month: number) {
  const base = monthKey(year, month);
  return organismeId ? `${organismeId}__${base}` : base;
}

export function findRentalMonth(months: RentalMonth[], year: number, month: number, organismeId?: string) {
  return (
    months.find(
      (m) =>
        m.year === year &&
        m.month === month &&
        (!organismeId || !m.organismeId || m.organismeId === organismeId)
    ) ?? null
  );
}

export function emptyRentalMonth(year: number, month: number, organismeId?: string): RentalMonth {
  return {
    id: rentalMonthId(organismeId, year, month),
    year,
    month,
    sealed: false,
    lines: [],
    updatedAt: new Date().toISOString(),
    organismeId,
  };
}

/** Ne plus clôturer automatiquement les mois passés (saisie historique autorisée). */
export function sealExpiredRentalMonths(months: RentalMonth[]): RentalMonth[] {
  return months;
}

export function rentalTotals(lines: RentalLine[]) {
  const aPayer = lines.reduce((s, l) => s + (Number(l.montantAPayer) || 0), 0);
  const encaisse = lines.reduce((s, l) => s + (Number(l.montantEncaisse) || 0), 0);
  const jours = lines.reduce((s, l) => s + (Number(l.jours) || 0), 0);
  return {
    count: lines.length,
    jours,
    aPayer,
    encaisse,
    ecart: aPayer - encaisse,
  };
}

export function nextRentalNumero(lines: RentalLine[]) {
  const nums = lines.map((l) => parseInt(String(l.numero), 10)).filter((n) => Number.isFinite(n));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}

export function newRentalLine(lines: RentalLine[]): RentalLine {
  const date = todayIso();
  return {
    id: uid(),
    numero: nextRentalNumero(lines),
    date,
    client: "",
    vehicule: "",
    immatriculation: "",
    jours: 0,
    montantAPayer: 0,
    montantEncaisse: 0,
    livreur: "",
    dateRemiseCaisse: "",
    statut: "non payé",
    nbProlongements: 0,
    statutProlongement: "",
    montantProlongementEncaisse: 0,
    modePaiement: "",
    observation: "",
    sealed: false,
  };
}

export function selectableRentalMonths(stored: RentalMonth[], span = 48) {
  const now = currentYearMonth();
  const keys = new Set<string>();
  for (let i = 0; i < span; i++) {
    const d = new Date(now.year, now.month - 1 - i, 1);
    keys.add(monthKey(d.getFullYear(), d.getMonth() + 1));
  }
  for (const m of stored) keys.add(monthKey(m.year, m.month));
  return [...keys]
    .map((k) => {
      const [y, mo] = k.split("-").map(Number);
      return { year: y, month: mo };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

export function statusColor(status: string) {
  if (status === "soldé" || status === "Encaissé") return "#2C5F2E";
  if (status === "partiellement payé" || status === "Partiellement encaissé") return "#B8923A";
  return "#C0392B";
}

export function prolongementStatusColor(status: string) {
  if (status === "Encaissé") return "#2C5F2E";
  if (status === "Partiellement encaissé") return "#B8923A";
  if (status === "Non encaissé") return "#C0392B";
  return "#888";
}
