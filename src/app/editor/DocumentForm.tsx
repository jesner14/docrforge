import { PlusCircle, Trash2 } from "lucide-react";
import type { DocData, DocTemplate, TemplateField } from "../lib/types";
import { asNumber, asRows, asString, CURRENCY_OPTIONS, formatMoney, inp, lbl, uid } from "../lib/helpers";
import { visibleFormFields } from "../lib/organismeHeader";
import { useSettings } from "../lib/settings";

export type DocFormChangeOptions = { immediate?: boolean };

function groupFields(fields: TemplateField[]) {
  const map = new Map<string, TemplateField[]>();
  fields.forEach((f) => {
    const s = f.section || "Informations";
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(f);
  });
  return [...map.entries()];
}

export function DocumentForm({
  template,
  data,
  onChange,
  compact = false,
}: {
  template: DocTemplate;
  data: DocData;
  onChange: (d: DocData, opts?: DocFormChangeOptions) => void;
  compact?: boolean;
}) {
  const { settings } = useSettings();
  const patch = (next: DocData, opts?: DocFormChangeOptions) => onChange(next, opts);
  const set = (key: string, value: unknown, opts?: DocFormChangeOptions) =>
    patch({ ...data, [key]: value }, opts);
  const fieldInp = compact
    ? "w-full px-2 py-1 rounded-md border border-border bg-white text-[11px] outline-none focus:ring-1 focus:ring-ring"
    : inp;
  const fieldLbl = compact
    ? "block text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-muted-foreground"
    : lbl;
  const sectionSize = compact ? "0.8rem" : "0.95rem";
  const gap = compact ? "gap-2" : "gap-3";
  const sectionGap = compact ? "space-y-3" : "space-y-7";
  const innerGap = compact ? "space-y-2" : "space-y-3";

  const updateRow = (field: TemplateField, id: string, col: string, value: unknown) => {
    const rows = asRows(data[field.key]).map((r) => (r.id === id ? { ...r, [col]: value } : r));
    set(field.key, rows);
  };

  const addRow = (field: TemplateField) => {
    const row: Record<string, unknown> = { id: uid() };
    (field.columns || []).forEach((c) => {
      row[c.key] = c.type === "number" ? 0 : "";
    });
    set(field.key, [...asRows(data[field.key]), row], { immediate: true });
  };

  const removeRow = (field: TemplateField, id: string) => {
    set(
      field.key,
      asRows(data[field.key]).filter((r) => r.id !== id),
      { immediate: true }
    );
  };

  const formFields = visibleFormFields(template.fields ?? []);

  return (
    <div className={sectionGap}>
      {groupFields(formFields).map(([section, fields]) => (
        <div key={section} className={innerGap}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: sectionSize, fontWeight: 600, color: "#1C2340" }}>
            {section}
          </h3>
          <div className={`grid grid-cols-2 ${gap}`}>
            {fields.map((field) => {
              if (field.type === "table") {
                const cols = field.columns || [];
                const rows = asRows(data[field.key]);
                const isMoney = cols.some((c) => c.key === "unitPrice");
                const currency = settings.currency;
                return (
                  <div key={field.key} className="col-span-2 space-y-2">
                    {rows.map((row) => (
                      <div key={asString(row.id)} className="flex gap-2 items-center">
                        {cols.map((col) => (
                          <input
                            key={col.key}
                            className={fieldInp + (col.type === "number" ? " text-right" : "")}
                            style={{ flex: col.type === "number" ? "0 0 90px" : 1 }}
                            type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                            placeholder={col.label}
                            value={asString(row[col.key])}
                            onChange={(e) =>
                              updateRow(
                                field,
                                asString(row.id),
                                col.key,
                                col.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                              )
                            }
                          />
                        ))}
                        {isMoney && (
                          <div
                            className="text-xs font-semibold text-right flex-shrink-0"
                            style={{ fontFamily: "'DM Mono', monospace", color: "#1C2340", minWidth: currency === "FCFA" ? 108 : 88 }}
                          >
                            {formatMoney(asNumber(row.qty) * asNumber(row.unitPrice), currency)}
                          </div>
                        )}
                        <button
                          onClick={() => removeRow(field, asString(row.id))}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addRow(field)}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: "#B8923A" }}
                    >
                      <PlusCircle size={14} />
                      Ajouter une ligne
                    </button>
                  </div>
                );
              }

              const span = field.type === "textarea" || field.key === "currency" || field.label.length > 18 ? "col-span-2" : "";
              return (
                <div key={field.key} className={span}>
                  <label className={fieldLbl}>{field.label}</label>
                  {field.key === "currency" ? (
                    <div
                      className={`${compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-sm"} rounded-lg border border-border`}
                      style={{ background: "#F7F6F2", color: "#1C2340" }}
                    >
                      {CURRENCY_OPTIONS.find((c) => c.value === settings.currency)?.hint}{" "}
                      {CURRENCY_OPTIONS.find((c) => c.value === settings.currency)?.label}
                      {!compact && (
                        <span className="block text-[11px] mt-0.5" style={{ color: "#888" }}>
                          Définie dans Paramétrage — appliquée à tous les documents.
                        </span>
                      )}
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className={fieldInp}
                      rows={compact ? 2 : 4}
                      placeholder={field.placeholder}
                      value={asString(data[field.key])}
                      onChange={(e) => set(field.key, e.target.value)}
                      style={{ resize: "vertical" }}
                    />
                  ) : field.type === "select" ? (
                    <select className={fieldInp} value={asString(data[field.key])} onChange={(e) => set(field.key, e.target.value)}>
                      {(field.options || []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={fieldInp}
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                      placeholder={field.placeholder}
                      value={asString(data[field.key])}
                      onChange={(e) =>
                        set(field.key, field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
