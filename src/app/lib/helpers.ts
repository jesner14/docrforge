import type { DocData } from "./types";

export type CurrencyCode = "EUR" | "USD" | "FCFA";

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string; hint: string }[] = [
  { value: "EUR", label: "Euro", hint: "€" },
  { value: "USD", label: "Dollar", hint: "$" },
  { value: "FCFA", label: "FCFA", hint: "F CFA" },
];

export function asCurrency(v: unknown): CurrencyCode {
  const s = String(v || "EUR").toUpperCase().replace(/\s/g, "");
  if (s === "USD" || s === "DOLLAR" || s === "$") return "USD";
  if (s === "FCFA" || s === "XOF" || s === "XAF" || s === "CFA" || s === "FRANCCFA") return "FCFA";
  return "EUR";
}

export function formatMoney(n: number, currency?: unknown) {
  const code = asCurrency(currency);
  const amount = Number.isFinite(n) ? n : 0;
  if (code === "FCFA") {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
  }
  return new Intl.NumberFormat(code === "USD" ? "en-US" : "fr-FR", {
    style: "currency",
    currency: code === "USD" ? "USD" : "EUR",
  }).format(amount);
}

export function currencyLabel(currency?: unknown) {
  const code = asCurrency(currency);
  if (code === "USD") return "Dollar ($)";
  if (code === "FCFA") return "Franc CFA";
  return "Euro (€)";
}

export function eur(n: number) {
  return formatMoney(n, "EUR");
}

export function formatDateFr(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function asString(v: unknown, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export function asNumber(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

export function asBool(v: unknown, fallback = false) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

export function asRows(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

export function interpolate(text: string, data: DocData) {
  return (text || "").replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = data[key];
    if (val === null || val === undefined || Array.isArray(val)) return "";
    return String(val);
  });
}

export function statusColor(s: string) {
  if (s === "Envoyé") return "#2C5F2E";
  if (s === "Brouillon") return "#7B4F00";
  return "#1C2340";
}

export const inp =
  "w-full px-3 py-2 rounded-lg text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring bg-white transition-shadow";
export const lbl =
  "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";
