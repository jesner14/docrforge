import type { ReactNode } from "react";
import type { DesignerBlock, DocData, DocTemplate } from "../lib/types";
import {
  asNumber,
  asRows,
  asString,
  asBool,
  asCurrency,
  currencyLabel,
  formatMoney,
  formatDateFr,
  interpolate,
  type CurrencyCode,
} from "../lib/helpers";
import { useSettings } from "../lib/settings";

function Sheet({ children, accent = "#1C2340" }: { children: ReactNode; accent?: string }) {
  return (
    <div
      className="doc-preview-page bg-white rounded-xl shadow-xl text-sm"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        borderTop: `4px solid ${accent}`,
        width: "100%",
        maxWidth: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      {children}
    </div>
  );
}

function CompanyHead({ data, kicker, showLegal = false }: { data: DocData; kicker: string; showLegal?: boolean }) {
  return (
    <div className="px-6 sm:px-8 py-8" style={{ background: "#1C2340", color: "#fff", boxSizing: "border-box" }}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {data.companyLogo ? (
            <img
              src={asString(data.companyLogo)}
              alt=""
              className="w-14 h-14 object-contain rounded bg-white/10 p-1 flex-shrink-0"
            />
          ) : null}
          <div className="min-w-0">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, wordBreak: "break-word" }}>
              {asString(data.companyName, "Votre entreprise")}
            </div>
            <div style={{ opacity: 0.55, fontSize: "0.75rem", marginTop: 6, lineHeight: 1.6, wordBreak: "break-word" }}>
              {asString(data.companyAddress)}
              <br />
              {asString(data.companyEmail)}
              {data.companyPhone ? ` · ${asString(data.companyPhone)}` : ""}
              {showLegal && data.companySiret ? (
                <>
                  <br />
                  SIRET {asString(data.companySiret)}
                  {data.companyTva ? ` · TVA ${asString(data.companyTva)}` : ""}
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 max-w-[42%]">
          <div style={{ fontSize: "0.6rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {kicker}
            {data.currency ? ` · ${asCurrency(data.currency)}` : ""}
          </div>
          {data.docNumber ? (
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "1.05rem",
                fontWeight: 500,
                color: "#B8923A",
                marginTop: 2,
                wordBreak: "break-all",
              }}
            >
              #{asString(data.docNumber)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LineTable({
  data,
  showTax,
  showNotes = true,
  unitLabel = "Total",
}: {
  data: DocData;
  showTax: boolean;
  showNotes?: boolean;
  unitLabel?: string;
}) {
  const items = asRows(data.items);
  const money = (n: number) => formatMoney(n, data.currency);
  const sub = items.reduce((s, i) => s + asNumber(i.qty) * asNumber(i.unitPrice), 0);
  const rate = asNumber(data.taxRate);
  const tax = showTax ? sub * (rate / 100) : 0;
  const total = sub + tax;

  const colWidths = ["44%", "12%", "22%", "22%"];

  return (
    <div className="px-6 sm:px-8 py-5" style={{ boxSizing: "border-box" }}>
      <table className="w-full" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #1C2340" }}>
            {["Description", "Qté", "Prix unit.", unitLabel].map((h, i) => (
              <th
                key={h}
                className="py-2"
                style={{
                  width: colWidths[i],
                  textAlign: i === 0 ? "left" : "right",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#1C2340",
                  fontWeight: 600,
                  paddingLeft: i === 0 ? 0 : 4,
                  paddingRight: i === 0 ? 8 : 0,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={asString(item.id, String(idx))} style={{ borderBottom: "1px solid rgba(28,35,64,0.05)" }}>
              <td
                className="py-2.5"
                style={{ color: item.description ? "#333" : "#ccc", wordBreak: "break-word", paddingRight: 8 }}
              >
                {asString(item.description, "—")}
              </td>
              <td
                className="py-2.5 text-right"
                style={{ fontFamily: "'DM Mono', monospace", color: "#555", fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                {asNumber(item.qty)}
              </td>
              <td
                className="py-2.5 text-right"
                style={{ fontFamily: "'DM Mono', monospace", color: "#555", fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                {money(asNumber(item.unitPrice))}
              </td>
              <td
                className="py-2.5 text-right"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  color: "#1C2340",
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                }}
              >
                {money(asNumber(item.qty) * asNumber(item.unitPrice))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-4">
        <div style={{ width: "100%", maxWidth: 260, minWidth: 0 }}>
          <div
            className="flex justify-between gap-4 py-1.5"
            style={{ fontSize: "0.82rem", color: "#777", borderTop: "1px solid rgba(28,35,64,0.08)" }}
          >
            <span className="flex-shrink-0">{showTax ? "Sous-total HT" : "Total"}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{money(sub)}</span>
          </div>
          {showTax && (
            <>
              <div className="flex justify-between gap-4 py-1.5" style={{ fontSize: "0.82rem", color: "#777" }}>
                <span className="flex-shrink-0">TVA {rate}%</span>
                <span style={{ fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{money(tax)}</span>
              </div>
              <div className="flex justify-between gap-4 py-2 mt-1" style={{ borderTop: "2px solid #1C2340" }}>
                <span className="flex-shrink-0" style={{ fontWeight: 700, color: "#1C2340" }}>
                  Total TTC
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 700,
                    color: "#B8923A",
                    fontSize: "1.05rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {money(total)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      {showNotes && asString(data.notes) && (
        <div className="mt-6 p-4 rounded-lg" style={{ background: "#F7F6F2", borderLeft: "3px solid #B8923A" }}>
          <div
            style={{
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#B8923A",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Notes
          </div>
          <p style={{ fontSize: "0.78rem", color: "#666", whiteSpace: "pre-line" }}>{asString(data.notes)}</p>
        </div>
      )}
    </div>
  );
}

function ClientBand({
  data,
  showDueDate = true,
  showObject = true,
  extra,
}: {
  data: DocData;
  showDueDate?: boolean;
  showObject?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div
      className="px-6 sm:px-8 py-4 flex justify-between items-start gap-4"
      style={{ background: "#F7F6F2", borderBottom: "1px solid rgba(28,35,64,0.06)", boxSizing: "border-box" }}
    >
      <div className="min-w-0 flex-1">
        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: 4 }}>
          Destinataire
        </div>
        <div style={{ fontWeight: 600, color: "#1C2340", wordBreak: "break-word" }}>{asString(data.clientName, "—")}</div>
        <div style={{ fontSize: "0.8rem", color: "#777", marginTop: 2, whiteSpace: "pre-line", wordBreak: "break-word" }}>
          {asString(data.clientAddress)}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#777", wordBreak: "break-word" }}>{asString(data.clientEmail)}</div>
      </div>
      <div className="text-right text-xs flex-shrink-0" style={{ color: "#555", maxWidth: "48%" }}>
        <div>
          Date : <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatDateFr(asString(data.date))}</span>
        </div>
        {showDueDate && data.dueDate ? (
          <div>
            Échéance :{" "}
            <span style={{ fontFamily: "'DM Mono', monospace", color: "#C0392B" }}>
              {formatDateFr(asString(data.dueDate))}
            </span>
          </div>
        ) : null}
        {showObject && data.object ? (
          <div style={{ marginTop: 6, wordBreak: "break-word" }}>Objet : {asString(data.object)}</div>
        ) : null}
        {data.paymentMethod ? <div style={{ wordBreak: "break-word" }}>Règlement : {asString(data.paymentMethod)}</div> : null}
        {data.currency ? <div>Devise : {currencyLabel(data.currency)}</div> : null}
        {extra}
      </div>
    </div>
  );
}

function Commercial({
  data,
  title,
  showTax,
  showLegal = false,
  showDueDate = true,
  showObject = true,
  showNotes = true,
}: {
  data: DocData;
  title: string;
  showTax: boolean;
  showLegal?: boolean;
  showDueDate?: boolean;
  showObject?: boolean;
  showNotes?: boolean;
}) {
  return (
    <Sheet>
      <CompanyHead data={data} kicker={title} showLegal={showLegal} />
      <ClientBand data={data} showDueDate={showDueDate} showObject={showObject} />
      <LineTable data={data} showTax={showTax} showNotes={showNotes} />
      <div className="px-8 py-3 text-center" style={{ background: "#1C2340", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
        {asString(data.companyName)} · {asString(data.companyAddress)}
      </div>
    </Sheet>
  );
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
}) {
  return (
    <table className="w-full">
      <thead>
        <tr style={{ background: "#1C2340", color: "#fff" }}>
          {columns.map((c) => (
            <th key={c.key} className="text-left px-3 py-2" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={asString(row.id, String(i))} style={{ background: i % 2 ? "#F7F6F2" : "#fff" }}>
            {columns.map((c) => (
              <td key={c.key} className="px-3 py-2" style={{ fontSize: "0.8rem", color: "#333" }}>
                {asString(row[c.key], "—")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LetterShell({ data, kicker, children }: { data: DocData; kicker: string; children: ReactNode }) {
  return (
    <Sheet>
      <CompanyHead data={data} kicker={kicker} />
      <div className="p-8 space-y-5" style={{ color: "#1C2340" }}>
        {children}
      </div>
    </Sheet>
  );
}

function Signature({ data }: { data: DocData }) {
  return (
    <div className="pt-6 text-right">
      <div style={{ fontSize: "0.8rem", color: "#777" }}>
        {asString(data.city) ? `${asString(data.city)}, le ` : ""}
        {formatDateFr(asString(data.date))}
      </div>
      <div className="mt-6 inline-block text-center min-w-[180px]">
        <div style={{ fontWeight: 700 }}>{asString(data.signatory)}</div>
        <div style={{ fontSize: "0.78rem", color: "#888" }}>{asString(data.signatoryTitle)}</div>
        <div className="mt-8" style={{ fontFamily: "'Playfair Display', serif", color: "#B8923A", fontStyle: "italic" }}>
          {asString(data.signatory)}
        </div>
      </div>
    </div>
  );
}

function CustomBlocks({ blocks, data, template }: { blocks: DesignerBlock[]; data: DocData; template: DocTemplate }) {
  const fields = template.fields ?? [];
  return (
    <Sheet accent="#B8923A">
      <div className="p-8 space-y-4 min-h-[640px]">
        {blocks.map((b) => {
          if (b.type === "header-band") {
            return (
              <div key={b.id} className="-mx-8 -mt-8 mb-4 px-8 py-6" style={{ background: "#1C2340", color: "#fff" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700 }}>
                  {interpolate(b.content || "{{companyName}}", data)}
                </div>
                <div style={{ opacity: 0.55, fontSize: "0.75rem", marginTop: 4 }}>{interpolate(b.subtitle || "", data)}</div>
              </div>
            );
          }
          if (b.type === "heading") {
            const size = b.level === 1 ? "1.4rem" : b.level === 2 ? "1.1rem" : "0.95rem";
            return (
              <div
                key={b.id}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: size,
                  textAlign: b.align || "left",
                  color: "#1C2340",
                }}
              >
                {interpolate(b.content || "", data)}
              </div>
            );
          }
          if (b.type === "paragraph") {
            return (
              <p key={b.id} style={{ whiteSpace: "pre-line", color: "#333", lineHeight: 1.65, textAlign: b.align || "left" }}>
                {interpolate(b.content || "", data)}
              </p>
            );
          }
          if (b.type === "divider") {
            return <div key={b.id} style={{ height: 1, background: "rgba(28,35,64,0.12)" }} />;
          }
          if (b.type === "spacer") {
            return <div key={b.id} style={{ height: 18 }} />;
          }
          if (b.type === "field-row") {
            return (
              <div key={b.id} className="grid grid-cols-2 gap-3">
                {(b.keys || []).map((k) => {
                  const field = fields.find((f) => f.key === k);
                  return (
                    <div key={k}>
                      <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa" }}>
                        {field?.label || k}
                      </div>
                      <div style={{ fontWeight: 600, color: "#1C2340" }}>{asString(data[k], "—")}</div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (b.type === "table") {
            const field = fields.find((f) => f.key === b.tableField && f.type === "table");
            const cols = field?.columns ?? [];
            return (
              <div key={b.id} className="overflow-hidden rounded-lg border border-border">
                <SimpleTable columns={cols} rows={asRows(data[b.tableField || ""])} />
              </div>
            );
          }
          if (b.type === "signature") {
            return <Signature key={b.id} data={data} />;
          }
          return null;
        })}
      </div>
    </Sheet>
  );
}

export function DocumentPreview({
  template,
  data: raw,
  currency: currencyProp,
}: {
  template: DocTemplate;
  data: DocData;
  currency?: CurrencyCode;
}) {
  const { currency: ctxCurrency } = useSettings();
  const currency = currencyProp ?? ctxCurrency ?? asCurrency(raw.currency);
  const data = { ...raw, currency };
  const fields = template.fields ?? [];
  const layout = template.layout;

  if (layout === "custom" && template.blocks?.length) {
    return <CustomBlocks blocks={template.blocks} data={data} template={template} />;
  }

  if (layout.startsWith("invoice") || layout === "quote" || layout === "purchase-order" || layout === "receipt") {
    const titles: Record<string, string> = {
      invoice: "Facture",
      "invoice-simple": "Facture",
      "invoice-commercial": "Facture",
      "invoice-vat": "Facture",
      quote: "Devis",
      "purchase-order": "Bon de commande",
      receipt: "Reçu",
    };
    if (layout === "invoice") {
      return (
        <Commercial
          data={data}
          title={titles.invoice}
          showTax={asBool(data.showTva)}
          showLegal={asBool(data.showLegal)}
          showDueDate={asBool(data.showDueDate, true)}
          showObject={asBool(data.showObject)}
          showNotes={asBool(data.showNotes, true)}
        />
      );
    }
    const showTax = layout === "invoice-vat" || layout === "invoice-commercial" || layout === "quote" || layout === "receipt";
    const showLegal = layout === "invoice-commercial" || layout === "invoice-vat";
    return (
      <Commercial
        data={data}
        title={titles[layout] || template.name}
        showTax={showTax}
        showLegal={showLegal}
        showDueDate={layout !== "purchase-order"}
        showObject={layout === "invoice-commercial" || layout === "quote" || layout === "purchase-order"}
        showNotes
      />
    );
  }

  if (layout === "minutes" || layout === "assistant-minutes") {
    return (
      <LetterShell data={data} kicker="Compte rendu">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.45rem", fontWeight: 700 }}>
          {asString(data.title, template.name)}
        </h1>
        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "#666" }}>
          <div>Date : {formatDateFr(asString(data.date))} {asString(data.time)}</div>
          <div>Lieu : {asString(data.location)}</div>
          <div>Rédacteur : {asString(data.author)}</div>
          <div className="col-span-2">Participants : {asString(data.participants)}</div>
        </div>
        {data.agenda ? (
          <section>
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Ordre du jour</h3>
            <p style={{ whiteSpace: "pre-line", color: "#444" }}>{asString(data.agenda)}</p>
          </section>
        ) : null}
        <section>
          <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{layout === "assistant-minutes" ? "Points abordés" : "Échanges"}</h3>
          <p style={{ whiteSpace: "pre-line", color: "#444" }}>{asString(data.discussion)}</p>
        </section>
        {data.decisions ? (
          <section>
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Décisions</h3>
            <p style={{ whiteSpace: "pre-line", color: "#444" }}>{asString(data.decisions)}</p>
          </section>
        ) : null}
        <section>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Actions</h3>
          <SimpleTable
            columns={[
              { key: "task", label: "Action" },
              { key: "owner", label: "Responsable" },
              { key: "due", label: "Échéance" },
            ]}
            rows={asRows(data.actions)}
          />
        </section>
        {data.nextMeeting ? <p style={{ fontSize: "0.82rem", color: "#888" }}>Prochaine réunion : {asString(data.nextMeeting)}</p> : null}
      </LetterShell>
    );
  }

  if (layout === "official-minutes") {
    return (
      <LetterShell data={data} kicker="Procès-verbal">
        <div className="text-center">
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#B8923A" }}>
            Document officiel
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, marginTop: 6 }}>
            {asString(data.title)}
          </h1>
        </div>
        <p>
          L’an deux mille vingt-six, le {formatDateFr(asString(data.date))} à {asString(data.time)}, les membres se sont
          réunis à {asString(data.location)}, sous la présidence de <strong>{asString(data.president)}</strong>, {asString(data.secretary)}{" "}
          assurant le secrétariat de séance.
        </p>
        <p>
          <strong>Présents :</strong> {asString(data.attendees)}
          <br />
          <strong>Absents / représentés :</strong> {asString(data.absents)}
        </p>
        <h3 style={{ fontWeight: 700 }}>Délibérations</h3>
        <p style={{ whiteSpace: "pre-line" }}>{asString(data.resolutions)}</p>
        <p style={{ fontSize: "0.82rem", color: "#666" }}>{asString(data.notes)}</p>
        <Signature data={{ ...data, signatory: data.president, signatoryTitle: "Président de séance" }} />
      </LetterShell>
    );
  }

  if (layout === "letter" || layout === "convocation") {
    return (
      <LetterShell data={data} kicker={layout === "convocation" ? "Convocation" : "Courrier"}>
        <div className="flex justify-between gap-8">
          <div />
          <div style={{ fontSize: "0.85rem", whiteSpace: "pre-line" }}>
            {asString(data.clientName)}
            <br />
            {asString(data.clientAddress)}
          </div>
        </div>
        <div className="text-right text-xs" style={{ color: "#777" }}>
          {asString(data.city, "Paris")}, le {formatDateFr(asString(data.date))}
        </div>
        {data.reference ? <div style={{ fontSize: "0.78rem" }}>Réf. : {asString(data.reference)}</div> : null}
        <div>
          <strong>Objet :</strong> {asString(data.object || data.title)}
        </div>
        {layout === "convocation" ? (
          <div className="p-4 rounded-lg" style={{ background: "#F7F6F2" }}>
            <div>
              {asString(data.title)} — {formatDateFr(asString(data.date))} à {asString(data.time)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>{asString(data.location)}</div>
          </div>
        ) : null}
        <p style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{asString(data.body || data.agenda)}</p>
        <Signature data={data} />
      </LetterShell>
    );
  }

  if (layout === "memo") {
    return (
      <LetterShell data={data} kicker="Note de service">
        <div className="text-center">
          <div style={{ letterSpacing: "0.18em", textTransform: "uppercase", fontSize: "0.72rem", color: "#B8923A" }}>
            Note de service n° {asString(data.docNumber)}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, marginTop: 8 }}>
            {asString(data.object)}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <strong>De :</strong> {asString(data.from)}
          </div>
          <div>
            <strong>À :</strong> {asString(data.to)}
          </div>
          <div>
            <strong>Date :</strong> {formatDateFr(asString(data.date))}
          </div>
        </div>
        <p style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{asString(data.body)}</p>
        <Signature data={{ ...data, signatoryTitle: asString(data.signatoryTitle, "Direction") }} />
      </LetterShell>
    );
  }

  if (layout === "report") {
    return (
      <LetterShell data={data} kicker="Rapport">
        <div className="text-center pb-4" style={{ borderBottom: "2px solid #1C2340" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700 }}>{asString(data.title)}</h1>
          <div style={{ color: "#B8923A", marginTop: 4 }}>{asString(data.subtitle)}</div>
          <div style={{ fontSize: "0.78rem", color: "#888", marginTop: 8 }}>
            {asString(data.author)} · {asString(data.period)} · {formatDateFr(asString(data.date))}
          </div>
        </div>
        <section>
          <h3 style={{ fontWeight: 700, color: "#B8923A" }}>Synthèse</h3>
          <p style={{ whiteSpace: "pre-line" }}>{asString(data.summary)}</p>
        </section>
        <section>
          <h3 style={{ fontWeight: 700, color: "#B8923A" }}>Analyse</h3>
          <p style={{ whiteSpace: "pre-line" }}>{asString(data.findings)}</p>
        </section>
        <section>
          <h3 style={{ fontWeight: 700, color: "#B8923A" }}>Recommandations</h3>
          <p style={{ whiteSpace: "pre-line" }}>{asString(data.recommendations)}</p>
        </section>
      </LetterShell>
    );
  }

  if (layout === "certificate") {
    return (
      <LetterShell data={data} kicker="RH">
        <div className="text-center">
          <div style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.72rem", color: "#B8923A" }}>
            Attestation de travail
          </div>
          <div style={{ height: 2, width: 80, background: "#B8923A", margin: "12px auto" }} />
        </div>
        <p style={{ lineHeight: 1.8 }}>
          Je soussigné(e) <strong>{asString(data.signatory)}</strong>, {asString(data.signatoryTitle)} de la société{" "}
          <strong>{asString(data.companyName)}</strong>, immatriculée sous le SIRET {asString(data.companySiret)}, atteste
          que :
        </p>
        <div className="p-5 rounded-lg text-center" style={{ background: "#F7F6F2" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700 }}>
            {asString(data.employeeName)}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>
            né(e) le {formatDateFr(asString(data.employeeBirth))}
          </div>
        </div>
        <p style={{ lineHeight: 1.8 }}>
          est employé(e) au sein de notre entreprise en qualité de <strong>{asString(data.employeePosition)}</strong>, sous
          contrat <strong>{asString(data.contractType)}</strong>, depuis le {formatDateFr(asString(data.startDate))}, et
          ce à ce jour.
        </p>
        <p>La présente attestation est délivrée pour servir et valoir ce que de droit, notamment auprès de {asString(data.purpose)}.</p>
        <Signature data={data} />
      </LetterShell>
    );
  }

  if (layout === "attendance") {
    return (
      <LetterShell data={data} kicker="Émargement">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>{asString(data.title)}</h1>
        <div className="text-sm" style={{ color: "#666" }}>
          {formatDateFr(asString(data.date))} · {asString(data.time)} · {asString(data.location)}
          <br />
          Responsable : {asString(data.trainer)}
        </div>
        <SimpleTable
          columns={[
            { key: "name", label: "Nom" },
            { key: "service", label: "Service" },
            { key: "morning", label: "Matin" },
            { key: "afternoon", label: "Après-midi" },
          ]}
          rows={asRows(data.attendees)}
        />
        <p style={{ fontSize: "0.75rem", color: "#999" }}>Signature des participants sur l’original conservé par les RH.</p>
      </LetterShell>
    );
  }

  if (layout === "planning" || layout === "weekly-planning") {
    const cols =
      layout === "weekly-planning"
        ? [
            { key: "time", label: "Créneau" },
            { key: "mon", label: "Lundi" },
            { key: "tue", label: "Mardi" },
            { key: "wed", label: "Mercredi" },
            { key: "thu", label: "Jeudi" },
            { key: "fri", label: "Vendredi" },
          ]
        : [
            { key: "name", label: "Collaborateur" },
            { key: "mon", label: "Lun" },
            { key: "tue", label: "Mar" },
            { key: "wed", label: "Mer" },
            { key: "thu", label: "Jeu" },
            { key: "fri", label: "Ven" },
          ];
    return (
      <LetterShell data={data} kicker="Planning">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>{asString(data.title)}</h1>
        <div style={{ color: "#666", fontSize: "0.85rem" }}>
          {asString(data.period)} {data.service ? `· ${asString(data.service)}` : ""} {data.owner ? `· ${asString(data.owner)}` : ""}
        </div>
        <SimpleTable columns={cols} rows={asRows(data.slots)} />
        {data.notes ? <p style={{ fontSize: "0.82rem", color: "#666", whiteSpace: "pre-line" }}>{asString(data.notes)}</p> : null}
      </LetterShell>
    );
  }

  if (layout === "leave") {
    const approved = asString(data.status) === "Approuvé";
    return (
      <LetterShell data={data} kicker="Congés">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>Demande de congés</h1>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <strong>Salarié :</strong> {asString(data.employeeName)}
          </div>
          <div>
            <strong>Poste :</strong> {asString(data.employeePosition)}
          </div>
          <div>
            <strong>Type :</strong> {asString(data.leaveType)}
          </div>
          <div>
            <strong>Durée :</strong> {asString(data.days)} jour(s)
          </div>
          <div>
            <strong>Du</strong> {formatDateFr(asString(data.startDate))}
          </div>
          <div>
            <strong>Au</strong> {formatDateFr(asString(data.endDate))}
          </div>
        </div>
        <p style={{ whiteSpace: "pre-line" }}>{asString(data.reason)}</p>
        <div
          className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: approved ? "#2C5F2E18" : "#7B4F0018", color: approved ? "#2C5F2E" : "#7B4F00" }}
        >
          {asString(data.status)} — {asString(data.manager)}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#888" }}>Demande du {formatDateFr(asString(data.date))}</div>
      </LetterShell>
    );
  }

  if (layout === "agenda") {
    return (
      <LetterShell data={data} kicker="Agenda">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>{asString(data.title)}</h1>
        <div style={{ color: "#666" }}>
          {formatDateFr(asString(data.date))} · {asString(data.owner)}
        </div>
        <SimpleTable
          columns={[
            { key: "time", label: "Heure" },
            { key: "item", label: "Sujet" },
            { key: "where", label: "Lieu" },
          ]}
          rows={asRows(data.slots)}
        />
        {data.notes ? <p style={{ whiteSpace: "pre-line", color: "#555" }}>{asString(data.notes)}</p> : null}
      </LetterShell>
    );
  }

  if (layout === "tracking") {
    return (
      <LetterShell data={data} kicker="Suivi">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>{asString(data.title)}</h1>
        <div style={{ color: "#666", fontSize: "0.85rem" }}>
          {asString(data.period)} · Pilote : {asString(data.owner)}
        </div>
        <SimpleTable
          columns={[
            { key: "item", label: "Dossier" },
            { key: "owner", label: "Responsable" },
            { key: "due", label: "Échéance" },
            { key: "status", label: "Statut" },
            { key: "comment", label: "Commentaire" },
          ]}
          rows={asRows(data.rows)}
        />
      </LetterShell>
    );
  }

  if (template.blocks?.length) {
    return <CustomBlocks blocks={template.blocks} data={data} template={template} />;
  }

  return (
    <Sheet>
      <CompanyHead data={data} kicker={template.name} />
      <div className="p-8 text-sm" style={{ color: "#555" }}>
        Aperçu générique — renseignez les champs à gauche.
      </div>
    </Sheet>
  );
}
