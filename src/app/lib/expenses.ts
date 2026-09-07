import type { ExpenseLine, ExpenseMonth } from "./types";
import { uid } from "./helpers";

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthLabel(year: number, month: number) {
  return `${monthName(month)} ${year}`;
}

export function monthName(month: number) {
  const label = new Date(2000, month - 1, 1).toLocaleDateString("fr-FR", { month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isPastMonth(year: number, month: number) {
  const now = currentYearMonth();
  return year < now.year || (year === now.year && month < now.month);
}

export function isFutureMonth(year: number, month: number) {
  const now = currentYearMonth();
  return year > now.year || (year === now.year && month > now.month);
}

export function monthBounds(year: number, month: number) {
  const last = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    min: `${year}-${pad(month)}-01`,
    max: `${year}-${pad(month)}-${pad(last)}`,
  };
}

export function expenseMonthId(organismeId: string | undefined, year: number, month: number) {
  const base = monthKey(year, month);
  return organismeId ? `${organismeId}__${base}` : base;
}

export function findExpenseMonth(
  months: ExpenseMonth[],
  year: number,
  month: number,
  organismeId?: string
) {
  return (
    months.find(
      (m) =>
        m.year === year &&
        m.month === month &&
        (!organismeId || !m.organismeId || m.organismeId === organismeId)
    ) ?? null
  );
}

export function emptyMonth(year: number, month: number, organismeId?: string): ExpenseMonth {
  return {
    id: expenseMonthId(organismeId, year, month),
    year,
    month,
    sealed: false,
    lines: [],
    updatedAt: new Date().toISOString(),
    organismeId,
  };
}

/** Ne plus clôturer automatiquement les mois passés (saisie / récupération historique). */
export function sealExpiredMonths(months: ExpenseMonth[]): ExpenseMonth[] {
  return months;
}

export function expenseTotals(lines: ExpenseLine[]) {
  const entree = lines.reduce((s, l) => s + (Number(l.entree) || 0), 0);
  const montant = lines.reduce((s, l) => s + (Number(l.montant) || 0), 0);
  return { entree, montant, solde: entree - montant, count: lines.length };
}

export function nextItem(lines: ExpenseLine[]) {
  const nums = lines.map((l) => parseInt(String(l.item), 10)).filter((n) => Number.isFinite(n));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}

export function newExpenseLine(lines: ExpenseLine[]): ExpenseLine {
  return {
    id: uid(),
    item: nextItem(lines),
    libelle: "",
    codeRecu: "",
    date: todayIso(),
    entree: 0,
    montant: 0,
    observation: "",
  };
}

export function selectableMonths(stored: ExpenseMonth[], span = 48) {
  const now = currentYearMonth();
  const keys = new Set<string>();
  for (let i = 0; i < span; i++) {
    const d = new Date(now.year, now.month - 1 - i, 1);
    keys.add(monthKey(d.getFullYear(), d.getMonth() + 1));
  }
  for (const m of stored) keys.add(monthKey(m.year, m.month));
  return [...keys]
    .map(parseMonthKey)
    .sort((a, b) => b.year - a.year || b.month - a.month);
}
