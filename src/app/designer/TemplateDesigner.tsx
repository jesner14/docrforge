import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Columns2,
  Heading1,
  Minus,
  Plus,
  Save,
  Signature,
  Table2,
  Trash2,
  Type,
  PanelTop,
} from "lucide-react";
import type { DesignerBlock, DocTemplate, Role, TemplateField, User } from "../lib/types";
import { inp, lbl, uid } from "../lib/helpers";
import { useSettings } from "../lib/settings";
import { DocumentPreview } from "../previews/DocumentPreview";
import { BUILTIN_TEMPLATES, hydrateDefaults } from "../lib/templates";

const FIELD_TYPES: TemplateField["type"][] = ["text", "textarea", "date", "number", "email", "select", "table"];

function newBlock(type: DesignerBlock["type"]): DesignerBlock {
  const id = uid();
  if (type === "heading") return { id, type, content: "Titre du document", level: 1, align: "left" };
  if (type === "paragraph")
    return {
      id,
      type,
      content: "Saisissez votre texte. Utilisez {{nomDuChamp}} pour insérer une variable.",
      align: "left",
    };
  if (type === "header-band")
    return { id, type, content: "{{companyName}}", subtitle: "{{companyAddress}} · {{companyEmail}}" };
  if (type === "field-row") return { id, type, keys: ["date", "object"] };
  if (type === "table") return { id, type, tableField: "lignes" };
  if (type === "signature") return { id, type };
  if (type === "divider") return { id, type };
  return { id, type };
}

const STARTER_BLOCKS: DesignerBlock[] = [
  newBlock("header-band"),
  { id: uid(), type: "heading", content: "Nouveau modèle", level: 1, align: "center" },
  { id: uid(), type: "paragraph", content: "Madame, Monsieur,\n\n{{corps}}", align: "left" },
  newBlock("signature"),
];

const STARTER_FIELDS: TemplateField[] = [
  { key: "companyName", label: "Entreprise", type: "text", section: "En-tête" },
  { key: "companyAddress", label: "Adresse", type: "text", section: "En-tête" },
  { key: "companyEmail", label: "Email", type: "email", section: "En-tête" },
  { key: "companyPhone", label: "Téléphone", type: "text", section: "En-tête" },
  { key: "date", label: "Date", type: "date", section: "Document" },
  { key: "object", label: "Objet", type: "text", section: "Document" },
  { key: "corps", label: "Corps du texte", type: "textarea", section: "Document" },
  { key: "signatory", label: "Signataire", type: "text", section: "Signature" },
  { key: "signatoryTitle", label: "Fonction", type: "text", section: "Signature" },
  { key: "city", label: "Ville", type: "text", section: "Signature" },
];

export function TemplateDesigner({
  user,
  modules,
  initial,
  onSave,
  onCancel,
}: {
  user: User;
  modules: Role[];
  initial?: DocTemplate | null;
  onSave: (tpl: DocTemplate) => void;
  onCancel: () => void;
}) {
  const { settings } = useSettings();
  const [id] = useState(initial?.id || `custom-${uid()}`);
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "Modèle enregistré dans ma bibliothèque");
  const [basedOn, setBasedOn] = useState(
    initial?.basedOn ||
      (initial?.builtin ? initial.id : undefined) ||
      BUILTIN_TEMPLATES.find((t) => modules.includes(t.category))?.id ||
      ""
  );
  const [blocks, setBlocks] = useState<DesignerBlock[]>(initial?.blocks?.length ? initial.blocks : STARTER_BLOCKS);
  const [fields, setFields] = useState<TemplateField[]>(initial?.fields?.length ? initial.fields : STARTER_FIELDS);
  const [selected, setSelected] = useState<string | null>(blocks[0]?.id ?? null);
  const [preview, setPreview] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<TemplateField["type"]>("text");
  const [saveError, setSaveError] = useState("");

  const selectedBlock = blocks.find((b) => b.id === selected) || null;
  const typeOptions = BUILTIN_TEMPLATES.filter((t) => modules.includes(t.category));

  const draft: DocTemplate = useMemo(
    () => ({
      id,
      name: name.trim() || "Modèle sans titre",
      description,
      category: (typeOptions.find((t) => t.id === basedOn)?.category || modules[0] || user.role) as Role,
      icon: typeOptions.find((t) => t.id === basedOn)?.icon || "✨",
      color: typeOptions.find((t) => t.id === basedOn)?.color || "#B8923A",
      layout: "custom",
      builtin: false,
      basedOn: basedOn || undefined,
      ownerId: user.id,
      savedAt: new Date().toISOString(),
      fields,
      blocks,
      defaults: Object.fromEntries(fields.map((f) => [f.key, f.type === "table" ? [] : f.type === "number" ? 0 : ""])),
    }),
    [basedOn, blocks, description, fields, id, modules, name, typeOptions, user.id, user.role]
  );

  const sampleData = useMemo(() => {
    const base = hydrateDefaults(draft, user, settings.currency);
    return {
      ...base,
      companyName: user.company,
      corps: base.corps || "Ceci est un aperçu du modèle avec des données de démonstration.",
      object: base.object || name,
      date: base.date || "2026-08-19",
      signatory: user.name,
      signatoryTitle: user.title,
      city: "Paris",
    };
  }, [draft, name, user, settings.currency]);

  const updateBlock = (id: string, patch: Partial<DesignerBlock>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const insert = (type: DesignerBlock["type"]) => {
    const b = newBlock(type);
    if (type === "table" && !fields.some((f) => f.key === "lignes")) {
      setFields((fs) => [
        ...fs,
        {
          key: "lignes",
          label: "Tableau",
          type: "table",
          section: "Tableau",
          columns: [
            { key: "col1", label: "Colonne 1" },
            { key: "col2", label: "Colonne 2" },
            { key: "col3", label: "Colonne 3" },
          ],
        },
      ]);
    }
    setBlocks((bs) => {
      const idx = bs.findIndex((x) => x.id === selected);
      const next = [...bs];
      next.splice(idx >= 0 ? idx + 1 : next.length, 0, b);
      return next;
    });
    setSelected(b.id);
  };

  const addField = () => {
    const label = newFieldLabel.trim();
    if (!label) return;
    const key = label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (!key || fields.some((f) => f.key === key)) return;
    const field: TemplateField = {
      key,
      label,
      type: newFieldType,
      section: "Personnalisé",
      ...(newFieldType === "table"
        ? {
            columns: [
              { key: "col1", label: "Colonne 1" },
              { key: "col2", label: "Colonne 2" },
            ],
          }
        : {}),
      ...(newFieldType === "select" ? { options: ["Option A", "Option B"] } : {}),
    };
    setFields((fs) => [...fs, field]);
    setNewFieldLabel("");
  };

  const insertFieldToken = (key: string) => {
    if (!selectedBlock || (selectedBlock.type !== "paragraph" && selectedBlock.type !== "heading" && selectedBlock.type !== "header-band")) {
      insert("paragraph");
      return;
    }
    updateBlock(selectedBlock.id, { content: `${selectedBlock.content || ""} {{${key}}}` });
  };

  const ribbonBtn = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs hover:bg-white/10 transition-colors";

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#E8E6E0" }}>
      <div className="flex-shrink-0 text-white" style={{ background: "#1C2340" }}>
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Atelier de modèles</span>
            <span style={{ opacity: 0.35 }}>|</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du modèle à enregistrer"
              className="bg-transparent text-sm outline-none border-b border-transparent focus:border-white/30 px-1"
              style={{ minWidth: 220 }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview((v) => !v)} className={ribbonBtn}>
              {preview ? "Édition" : "Aperçu"}
            </button>
            <button onClick={onCancel} className={ribbonBtn} style={{ opacity: 0.7 }}>
              Fermer
            </button>
            <button
              onClick={() => {
                if (!name.trim()) {
                  setSaveError("Donnez un nom à ce modèle pour l’enregistrer.");
                  return;
                }
                setSaveError("");
                onSave(draft);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold"
              style={{ background: "#B8923A" }}
            >
              <Save size={13} />
              Enregistrer le modèle
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 px-3 py-2">
          <Tool onClick={() => insert("header-band")} icon={<PanelTop size={13} />} label="En-tête" />
          <Tool onClick={() => insert("heading")} icon={<Heading1 size={13} />} label="Titre" />
          <Tool onClick={() => insert("paragraph")} icon={<Type size={13} />} label="Paragraphe" />
          <Tool onClick={() => insert("field-row")} icon={<Columns2 size={13} />} label="Champs" />
          <Tool onClick={() => insert("table")} icon={<Table2 size={13} />} label="Tableau" />
          <Tool onClick={() => insert("divider")} icon={<Minus size={13} />} label="Séparateur" />
          <Tool onClick={() => insert("signature")} icon={<Signature size={13} />} label="Signature" />
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)", margin: "0 6px" }} />
          <button className={ribbonBtn} onClick={() => selected && updateBlock(selected, { align: "left" })}>
            <AlignLeft size={13} />
          </button>
          <button className={ribbonBtn} onClick={() => selected && updateBlock(selected, { align: "center" })}>
            <AlignCenter size={13} />
          </button>
          <button className={ribbonBtn} onClick={() => selected && updateBlock(selected, { align: "right" })}>
            <AlignRight size={13} />
          </button>
          {selectedBlock?.type === "heading" && (
            <>
              <button className={ribbonBtn} onClick={() => updateBlock(selectedBlock.id, { level: 1 })}>
                <Bold size={13} /> H1
              </button>
              <button className={ribbonBtn} onClick={() => updateBlock(selectedBlock.id, { level: 2 })}>
                H2
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 flex-shrink-0 bg-card border-r border-border overflow-auto p-4 space-y-4">
          <div>
            <label className={lbl}>Nom du modèle</label>
            <input className={inp} value={name} onChange={(e) => { setName(e.target.value); setSaveError(""); }} placeholder="Ex. Devis charte 2026" />
            {saveError ? <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{saveError}</p> : null}
          </div>
          <div>
            <label className={lbl}>Type de document</label>
            <select
              className={inp}
              value={basedOn}
              onChange={(e) => {
                const id = e.target.value;
                setBasedOn(id);
                const src = BUILTIN_TEMPLATES.find((t) => t.id === id);
                if (src && !initial) setFields(JSON.parse(JSON.stringify(src.fields)));
              }}
            >
              {typeOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Le modèle sera proposé à la génération de ce type.</p>
          </div>
          <div>
            <label className={lbl}>Description</label>
            <textarea className={inp} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={lbl} style={{ marginBottom: 0 }}>
                Bibliothèque de champs
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Cliquez pour insérer <code>{"{{champ}}"}</code> dans le bloc sélectionné.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fields.map((f) => (
                <button
                  key={f.key}
                  onClick={() => insertFieldToken(f.key)}
                  className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
                  style={{ fontFamily: "'DM Mono', monospace", color: "#1C2340" }}
                  title={f.label}
                >
                  {`{{${f.key}}}`}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className={lbl}>Nouveau champ</span>
            <input className={inp} placeholder="Ex. nom du salarié" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} />
            <select className={inp} value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as TemplateField["type"])}>
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              onClick={addField}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: "#1C2340" }}
            >
              <Plus size={13} /> Ajouter le champ
            </button>
          </div>
          <div className="space-y-1">
            {fields.map((f) => (
              <div key={f.key} className="flex items-center justify-between text-xs py-1 border-b border-border">
                <span>
                  {f.label} <span className="text-muted-foreground">({f.type})</span>
                </span>
                <button
                  onClick={() => setFields((fs) => fs.filter((x) => x.key !== f.key))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 overflow-auto p-8">
          {preview ? (
            <div className="max-w-[760px] mx-auto">
              <DocumentPreview template={draft} data={sampleData} />
            </div>
          ) : (
            <div
              className="max-w-[760px] mx-auto bg-white shadow-2xl min-h-[1000px] p-10 space-y-3"
              style={{ aspectRatio: "210/297", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {blocks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className="relative group rounded-md"
                  style={{
                    outline: selected === b.id ? "2px solid #B8923A" : "1px dashed transparent",
                    outlineOffset: 4,
                    cursor: "pointer",
                  }}
                >
                  <BlockEditor block={b} fields={fields} onChange={(patch) => updateBlock(b.id, patch)} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlocks((bs) => bs.filter((x) => x.id !== b.id));
                    }}
                    className="absolute -right-3 -top-3 opacity-0 group-hover:opacity-100 bg-white border border-border rounded-full p-1 shadow"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {blocks.length === 0 && (
                <div className="text-center text-muted-foreground py-24 text-sm">Insérez un bloc depuis le ruban.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tool({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs hover:bg-white/10"
    >
      {icon}
      {label}
    </button>
  );
}

function BlockEditor({
  block,
  fields,
  onChange,
}: {
  block: DesignerBlock;
  fields: TemplateField[];
  onChange: (p: Partial<DesignerBlock>) => void;
}) {
  if (block.type === "header-band") {
    return (
      <div className="-mx-10 -mt-10 mb-4 px-10 py-6" style={{ background: "#1C2340", color: "#fff" }}>
        <input
          className="w-full bg-transparent outline-none"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700 }}
          value={block.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
        />
        <input
          className="w-full bg-transparent outline-none mt-1"
          style={{ fontSize: "0.75rem", opacity: 0.55 }}
          value={block.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
        />
      </div>
    );
  }
  if (block.type === "heading") {
    return (
      <input
        className="w-full outline-none"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: block.level === 1 ? "1.5rem" : "1.1rem",
          textAlign: block.align,
          color: "#1C2340",
        }}
        value={block.content || ""}
        onChange={(e) => onChange({ content: e.target.value })}
      />
    );
  }
  if (block.type === "paragraph") {
    return (
      <textarea
        className="w-full outline-none"
        rows={4}
        style={{ textAlign: block.align, color: "#333", lineHeight: 1.65, resize: "vertical" }}
        value={block.content || ""}
        onChange={(e) => onChange({ content: e.target.value })}
      />
    );
  }
  if (block.type === "divider") {
    return <div style={{ height: 1, background: "rgba(28,35,64,0.15)", margin: "8px 0" }} />;
  }
  if (block.type === "spacer") {
    return <div style={{ height: 20, background: "repeating-linear-gradient(90deg,#eee 0 8px,transparent 8px 16px)" }} />;
  }
  if (block.type === "signature") {
    return (
      <div className="text-right py-4" style={{ color: "#888", fontSize: "0.85rem" }}>
        Zone de signature — {`{{city}}`}, le {`{{date}}`}
        <div className="mt-6" style={{ fontFamily: "'Playfair Display', serif", color: "#B8923A" }}>
          {`{{signatory}}`}
        </div>
      </div>
    );
  }
  if (block.type === "field-row") {
    const keys = block.keys || [];
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {keys.map((k) => (
            <div key={k} className="p-2 rounded-md" style={{ background: "#F7F6F2" }}>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", color: "#aaa" }}>
                {fields.find((f) => f.key === k)?.label || k}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem" }}>{`{{${k}}}`}</div>
            </div>
          ))}
        </div>
        <select
          className={inp}
          value=""
          onChange={(e) => {
            if (e.target.value) onChange({ keys: [...keys, e.target.value] });
          }}
        >
          <option value="">Ajouter un champ à la rangée…</option>
          {fields
            .filter((f) => f.type !== "table" && !keys.includes(f.key))
            .map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
        </select>
      </div>
    );
  }
  if (block.type === "table") {
    const tables = fields.filter((f) => f.type === "table");
    return (
      <div className="p-3 rounded-md border border-dashed border-border">
        <div className="text-xs mb-2" style={{ color: "#888" }}>
          Tableau lié au champ
        </div>
        <select className={inp} value={block.tableField || ""} onChange={(e) => onChange({ tableField: e.target.value })}>
          {tables.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label} ({t.key})
            </option>
          ))}
        </select>
      </div>
    );
  }
  return null;
}

