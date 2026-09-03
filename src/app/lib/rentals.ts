import type { RentalLine, RentalMonth, RentalStatus } from "./types";
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

export function addDaysIso(iso: string, days: number) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + Math.max(0, Math.floor(Number(days) || 0)));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date de remise véhicule = date de début + nombre de jours. */
export function computeDateRemiseVehicule(date: string, jours: number) {
  return addDaysIso(date, jours);
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
  const past = isPastMonth(year, month);
  return {
    id: rentalMonthId(organismeId, year, month),
    year,
    month,
    sealed: past,
    sealedAt: past ? new Date().toISOString() : undefined,
    lines: [],
    updatedAt: new Date().toISOString(),
    organismeId,
  };
}

export function sealExpiredRentalMonths(months: RentalMonth[]): RentalMonth[] {
  const now = new Date().toISOString();
  let changed = false;
  const next = months.map((m) => {
    if (!m.sealed && isPastMonth(m.year, m.month)) {
      changed = true;
      return { ...m, sealed: true, sealedAt: m.sealedAt || now };
    }
    return m;
  });
  return changed ? next : months;
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
    dateRemiseVehicule: computeDateRemiseVehicule(date, 0),
    statut: "non payé",
    modePaiement: "",
    observation: "",
    sealed: false,
  };
}

export function selectableRentalMonths(stored: RentalMonth[], span = 24) {
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
  if (status === "soldé") return "#2C5F2E";
  if (status === "partiellement payé") return "#B8923A";
  return "#C0392B";
}
