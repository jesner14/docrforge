import type { CurrencyCode } from "./helpers";
import { uid } from "./helpers";
import { currentYearMonth, monthKey, parseMonthKey } from "./expenses";
import { documentTitle, hydrateDefaults, recipientOf } from "./templates";
import type { DocTemplate, SavedDocument, User } from "./types";

export function docYearMonth(doc: SavedDocument): { year: number; month: number } {
  if (doc.docYear && doc.docMonth) return { year: doc.docYear, month: doc.docMonth };
  const raw = String(doc.data?.date || "");
  if (/^\d{4}-\d{2}/.test(raw)) {
    const [y, m] = raw.split("-");
    return { year: Number(y), month: Number(m) };
  }
  return currentYearMonth();
}

export function matchesMonth(doc: SavedDocument, year: number, month: number) {
  const dm = docYearMonth(doc);
  return dm.year === year && dm.month === month;
}

export function selectableDocMonths(docs: SavedDocument[], templateId: string) {
  const keys = new Set<string>();
  docs.filter((d) => d.templateId === templateId).forEach((d) => {
    const { year, month } = docYearMonth(d);
    keys.add(monthKey(year, month));
  });
  const now = currentYearMonth();
  keys.add(monthKey(now.year, now.month));
  return [...keys]
    .sort()
    .reverse()
    .map((k) => parseMonthKey(k));
}

export function newSavedDocument(
  template: DocTemplate,
  user: User,
  data: Record<string, unknown>,
  year: number,
  month: number
): SavedDocument {
  const day = Math.min(new Date().getDate(), new Date(year, month, 0).getDate());
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const merged = { ...data, date: data.date || iso };
  return {
    id: uid(),
    name: documentTitle(template, merged),
    templateId: template.id,
    templateName: template.name,
    category: template.category,
    recipient: recipientOf(merged),
    date: new Date(year, month - 1, day).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    status: "Brouillon",
    data: merged,
    authorId: user.id,
    organismeId: user.organismeId,
    docYear: year,
    docMonth: month,
    updatedAt: new Date().toISOString(),
  };
}

export function patchSavedDocument(doc: SavedDocument, template: DocTemplate, data: Record<string, unknown>): SavedDocument {
  const { year, month } = docYearMonth(doc);
  let docYear = year;
  let docMonth = month;
  const raw = String(data.date || "");
  if (/^\d{4}-\d{2}/.test(raw)) {
    const [y, m] = raw.split("-");
    docYear = Number(y);
    docMonth = Number(m);
  }
  return {
    ...doc,
    name: documentTitle(template, data),
    recipient: recipientOf(data),
    data,
    docYear,
    docMonth,
    updatedAt: new Date().toISOString(),
  };
}

export function freshDocData(template: DocTemplate, user: User, currency: CurrencyCode, year: number, month: number) {
  const day = Math.min(new Date().getDate(), new Date(year, month, 0).getDate());
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const base = hydrateDefaults(template, user, currency);
  return { ...base, date: base.date || iso };
}
