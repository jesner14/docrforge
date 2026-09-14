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
  if (s === "Envoyé" || s === "Finalisé") return "#2C5F2E";
  if (s === "Enregistré") return "#0E7C7B";
  if (s === "Brouillon") return "#7B4F00";
  return "#1C2340";
}

/** Couleur d’en-tête documents par défaut (bleu nuit). */
export const DEFAULT_HEADER_COLOR = "#1C2340";

/** Couleur de pied de page facture par défaut. */
export const DEFAULT_FOOTER_COLOR = "#2F4F9A";

export const HEADER_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "Bleu nuit", value: "#1C2340" },
  { label: "Bleu marine", value: "#1B3A5C" },
  { label: "Bleu pied", value: "#2F4F9A" },
  { label: "Vert forêt", value: "#1E4D3A" },
  { label: "Bordeaux", value: "#5C1A1A" },
  { label: "Anthracite", value: "#2C2C2C" },
  { label: "Prune", value: "#4A1942" },
  { label: "Jaune", value: "#F5C518" },
  { label: "Blanc", value: "#FFFFFF" },
];

/** Normalise une couleur hex (#RGB / #RRGGBB), sinon défaut. */
export function asHeaderColor(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return DEFAULT_HEADER_COLOR;
}

export function asFooterColor(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return DEFAULT_FOOTER_COLOR;
}

/** Texte lisible sur un fond d’en-tête (clair → bleu nuit, sombre → blanc). */
export function headerForeground(bg: unknown): string {
  const hex = asHeaderColor(bg).slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? DEFAULT_HEADER_COLOR : "#FFFFFF";
}

export type HeaderNameAlign = "left" | "right";

export function asHeaderNameAlign(value: unknown): HeaderNameAlign {
  return value === "right" ? "right" : "left";
}

/** Échelle du logo d’en-tête (×1 … ×4). Taille de base = 56 px. */
export type LogoScale = 1 | 2 | 3 | 4;

export function asLogoScale(value: unknown): LogoScale {
  const n = Number(value);
  if (n === 2 || n === 3 || n === 4) return n;
  return 1;
}

export function logoHeaderSizePx(scale: unknown): number {
  return 56 * asLogoScale(scale);
}

export const inp =
  "w-full px-3 py-2 rounded-lg text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring bg-white transition-shadow";
export const lbl =
  "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";
