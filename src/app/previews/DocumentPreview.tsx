import type { ReactNode } from "react";
import type { DesignerBlock, DocData, DocTemplate } from "../lib/types";
import {
  asNumber,
  asRows,
  asString,
  asBool,
  asCurrency,
  asHeaderColor,
  asFooterColor,
  asHeaderNameAlign,
  logoHeaderSizePx,
  headerForeground,
  currencyLabel,
  formatMoney,
  formatDateFr,
  interpolate,
  type CurrencyCode,
} from "../lib/helpers";
import { useOrganisme, useSettings } from "../lib/settings";

function Sheet({
  children,
  accent = "#1C2340",
  watermark,
}: {
  children: ReactNode;
  accent?: string;
  watermark?: string;
}) {
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
        position: "relative",
      }}
    >
      {watermark ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={watermark}
            alt=""
            style={{
              width: "58%",
              maxWidth: 440,
              maxHeight: "58%",
              objectFit: "contain",
              opacity: 0.1,
            }}
          />
        </div>
      ) : null}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function useDocHeaderColor(data: DocData) {
  const { organisme } = useOrganisme();
  return asHeaderColor(data.companyHeaderColor || organisme.headerColor);
}

function useDocFooterColor(data: DocData) {
  const { organisme } = useOrganisme();
  return asFooterColor(data.companyFooterColor || organisme.footerColor);
}

function useDocLogoOptions(data: DocData) {
  const { organisme } = useOrganisme();
  const logo = asString(data.companyLogo || organisme.logo);
  const inHeader = asBool(data.companyLogoInHeader, organisme.logoInHeader !== false) && !!logo;
  const watermark =
    asBool(data.companyLogoAsBackground, !!organisme.logoAsBackground) && logo ? logo : undefined;
  return { logo, inHeader, watermark };
}

function CompanyHead({ data, kicker, showLegal: _showLegal = false }: { data: DocData; kicker: string; showLegal?: boolean }) {
  const accent = useDocHeaderColor(data);
  const { inHeader, logo } = useDocLogoOptions(data);
  const { organisme } = useOrganisme();
  const nameAlign = asHeaderNameAlign(data.companyHeaderNameAlign || organisme.headerNameAlign);
  const logoAlign = asHeaderNameAlign(data.companyLogoAlign || organisme.logoAlign);
  const nameRight = nameAlign === "right";
  const logoRight = logoAlign === "right";
  const showDocRef = asBool(data.companyShowHeaderDocRef, organisme.showHeaderDocRef !== false);
  const logoSize = logoHeaderSizePx(data.companyLogoScale ?? organisme.logoScale);
  const fg = headerForeground(accent);
  const muted = fg === "#FFFFFF" ? "rgba(255,255,255,0.55)" : "rgba(28,35,64,0.55)";

  const logoEl = inHeader ? (
    <img
      src={logo}
      alt=""
      className="object-contain flex-shrink-0"
      style={{
        width: logoSize,
        height: logoSize,
      }}
    />
  ) : null;

  const clientEl = (
    <div className="min-w-0" style={{ textAlign: nameRight ? "right" : "left", width: nameRight ? "100%" : undefined }}>
      {asString(data.date) ? (
        <div style={{ color: muted, fontSize: "0.72rem", marginBottom: 6, letterSpacing: "0.01em" }}>
          {asString(data.city, "Dakar")}, le {formatDateFr(asString(data.date))}
        </div>
      ) : null}
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, wordBreak: "break-word" }}>
        {asString(data.clientName, "—")}
      </div>
      {asString(data.clientAddress) ? (
        <div style={{ color: muted, fontSize: "0.75rem", marginTop: 6, lineHeight: 1.6, whiteSpace: "pre-line", wordBreak: "break-word" }}>
          {asString(data.clientAddress)}
        </div>
      ) : null}
      {asString(data.clientEmail) ? (
        <div style={{ color: muted, fontSize: "0.75rem", marginTop: 4, wordBreak: "break-word" }}>
          {asString(data.clientEmail)}
        </div>
      ) : null}
    </div>
  );

  const docEl = (
    <div className="min-w-0">
      <div
        style={{
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 700,
          color: fg,
          marginBottom: showDocRef && data.docNumber ? 6 : 0,
        }}
      >
        {kicker}
      </div>
      {showDocRef && data.docNumber ? (
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "1.05rem",
            fontWeight: 500,
            color: fg === "#FFFFFF" ? "#FFFFFF" : "#000000",
            wordBreak: "break-all",
          }}
        >
          #{asString(data.docNumber)}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className="px-6 sm:px-8 py-8"
      style={{
        background: accent,
        color: fg,
        boxSizing: "border-box",
        borderBottom: accent === "#FFFFFF" ? "1px solid rgba(28,35,64,0.12)" : undefined,
      }}
    >
      <div className="flex justify-between items-start gap-4 w-full">
        <div
          className="flex items-start gap-3 min-w-0"
          style={{
            textAlign: "left",
            flex: nameRight ? "0 1 auto" : "1 1 0%",
          }}
        >
          {inHeader && !logoRight ? logoEl : null}
          {!nameRight ? clientEl : docEl}
        </div>
        <div
          className="flex items-start gap-3 min-w-0"
          style={{
            textAlign: "right",
            marginLeft: "auto",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            flex: nameRight ? "1 1 0%" : "0 1 auto",
            maxWidth: nameRight ? "58%" : undefined,
          }}
        >
          {inHeader && logoRight ? logoEl : null}
          {nameRight ? clientEl : docEl}
        </div>
      </div>
    </div>
  );
}

function LineTable({
  data,
  showTax,
  showNotes = true,
  showTotals = true,
  unitLabel = "Total",
}: {
  data: DocData;
  showTax: boolean;
  showNotes?: boolean;
  showTotals?: boolean;
  unitLabel?: string;
}) {
  const items = asRows(data.items);
  const money = (n: number) => formatMoney(n, data.currency);
  const lineItems = items.filter((i) => i.kind !== "photo");
  const photoItems = items.filter((i) => i.kind === "photo");
  const sub = lineItems.reduce((s, i) => s + asNumber(i.qty) * asNumber(i.unitPrice), 0);
  // Si TVA affichée sans taux renseigné, fallback 20 % (cas des anciennes factures).
  const rate = showTax ? (asNumber(data.taxRate) > 0 ? asNumber(data.taxRate) : 20) : 0;
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
          {lineItems.map((item, idx) => (
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
      {showTotals ? (
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
      ) : null}
      {photoItems.length > 0 ? (
        <div className="mt-6 space-y-4">
          {photoItems.map((item, idx) => (
            <div key={asString(item.id, String(idx))}>
              {asString(item.image) ? (
                <img
                  src={asString(item.image)}
                  alt={asString(item.caption) || ""}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: 320,
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    margin: "0 auto",
                  }}
                />
              ) : (
                <div style={{ color: "#bbb", fontSize: "0.8rem", textAlign: "center", padding: "12px 0" }}>
                  Photo non renseignée
                </div>
              )}
              {asString(item.caption) ? (
                <div style={{ marginTop: 8, textAlign: "center", fontSize: "0.78rem", color: "#666" }}>
                  {asString(item.caption)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
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
        {asString(data.clientEmail) ? (
          <div style={{ fontSize: "0.8rem", color: "#777", wordBreak: "break-word" }}>{asString(data.clientEmail)}</div>
        ) : null}
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

function buildInvoiceFooterLines(data: DocData): string[] {
  const lines: string[] = [];
  const address = asString(data.companyAddress).trim();
  if (address) lines.push(address);

  const rc = asString(data.companyRc).trim();
  const ninea = asString(data.companyNinea).trim();
  const legal: string[] = [];
  if (rc) legal.push(`RC: ${rc}`);
  if (ninea) legal.push(`NINEA: ${ninea}`);
  if (legal.length) lines.push(legal.join(" - "));

  const rib = asString(data.companyRib).trim();
  if (rib) lines.push(`Rib: ${rib}`);

  const contact: string[] = [];
  const tel = asString(data.companyPhone).trim();
  const website = asString(data.companyWebsite).trim();
  const email = asString(data.companyEmail).trim();
  if (tel) contact.push(`Tel: ${tel}`);
  if (website) contact.push(website);
  if (email) contact.push(email);
  if (contact.length) lines.push(contact.join(" // "));

  let slogan = asString(data.companySlogan).trim();
  if (slogan) {
    if (!/^«/.test(slogan)) {
      slogan = `« ${slogan.replace(/^["«]\s*|\s*["»]$/g, "").trim()} »`;
    }
    lines.push(slogan);
  }

  return lines;
}

function DeliveryNote({ data }: { data: DocData }) {
  const accent = "#0E7C7B";
  const { logo, inHeader, watermark } = useDocLogoOptions(data);
  const showTax = asBool(data.showTva);
  const footerLines = buildInvoiceFooterLines(data);
  const money = (n: number) => formatMoney(n, data.currency);
  const lineItems = asRows(data.items).filter((i) => i.kind !== "photo");
  const sub = lineItems.reduce((s, i) => s + asNumber(i.qty) * asNumber(i.unitPrice), 0);
  const rate = showTax ? (asNumber(data.taxRate) > 0 ? asNumber(data.taxRate) : 20) : 0;
  const tax = showTax ? sub * (rate / 100) : 0;
  const total = sub + tax;
  const box = {
    border: "1.5px solid #1C2340",
    borderRadius: 10,
    padding: "10px 12px",
  } as const;

  const contactLines = [
    asString(data.companyAddress).trim(),
    asString(data.companyPhone).trim() ? `Tél. ${asString(data.companyPhone).trim()}` : "",
    asString(data.companyEmail).trim() ? `Adresse mail : ${asString(data.companyEmail).trim()}` : "",
    asString(data.companyWebsite).trim() ? `Site internet : ${asString(data.companyWebsite).trim()}` : "",
  ].filter(Boolean);

  const totalRow = (label: string, value: string, bg: string, fg = "#fff") => (
    <div
      className="flex justify-between gap-3 px-3 py-2"
      style={{ background: bg, color: fg, fontSize: "0.78rem", fontWeight: 700 }}
    >
      <span>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );

  return (
    <Sheet accent={accent} watermark={watermark}>
      <div className="px-6 sm:px-8 pt-6 pb-3" style={{ boxSizing: "border-box" }}>
        <div className="flex justify-between items-start gap-6">
          <div className="min-w-0" style={{ flex: "0 1 42%" }}>
            {inHeader && logo ? (
              <img
                src={logo}
                alt=""
                className="object-contain mb-3"
                style={{ width: 88, height: 88, border: "1px solid rgba(28,35,64,0.15)", borderRadius: 6 }}
              />
            ) : (
              <div
                className="mb-3 flex items-center justify-center text-center"
                style={{
                  width: 88,
                  height: 88,
                  border: "1.5px solid #1C2340",
                  borderRadius: 6,
                  fontSize: "0.62rem",
                  color: "#888",
                  lineHeight: 1.3,
                  padding: 6,
                }}
              >
                VOTRE
                <br />
                LOGO ICI
              </div>
            )}
            <div style={{ fontSize: "0.72rem", color: "#444", lineHeight: 1.55, whiteSpace: "pre-line" }}>
              {contactLines.length ? contactLines.join("\n") : "—"}
            </div>
          </div>

          <div className="min-w-0" style={{ flex: "1 1 52%" }}>
            <div
              className="text-center mb-3"
              style={{
                ...box,
                background: "#fff",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: "1.15rem",
                color: "#1C2340",
                lineHeight: 1.35,
              }}
            >
              Bon de livraison
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.95rem", fontWeight: 600, marginTop: 2 }}>
                N° {asString(data.docNumber, "—")}
              </div>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#333", lineHeight: 1.7, marginBottom: 10 }}>
              <div>
                <span style={{ color: "#777" }}>En date du </span>
                {asString(data.date) ? formatDateFr(asString(data.date)) : "—"}
              </div>
              <div>
                <span style={{ color: "#777" }}>Référence client </span>
                {asString(data.clientRef, "—")}
              </div>
              <div>
                <span style={{ color: "#777" }}>À l&apos;attention de </span>
                {asString(data.attentionOf, "—")}
              </div>
            </div>
            <div style={{ ...box, minHeight: 88, fontSize: "0.82rem", color: "#1C2340", lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {asString(data.clientName, "—")}
              </div>
              {asString(data.clientAddress) ? (
                <div style={{ color: "#555", marginTop: 4, whiteSpace: "pre-line" }}>{asString(data.clientAddress)}</div>
              ) : null}
              {asString(data.clientEmail) ? (
                <div style={{ color: "#777", marginTop: 4, fontSize: "0.75rem" }}>{asString(data.clientEmail)}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="mt-4 pt-2"
          style={{
            borderTop: "1px solid rgba(28,35,64,0.2)",
            fontSize: "0.78rem",
            color: asString(data.generalComment) ? "#444" : "#aaa",
            minHeight: 28,
          }}
        >
          <span style={{ color: "#777" }}>Commentaire général : </span>
          {asString(data.generalComment) || "zone libre"}
        </div>
      </div>

      <LineTable data={data} showTax={showTax} showNotes={false} showTotals={false} />

      <div className="px-6 sm:px-8 pb-4" style={{ boxSizing: "border-box" }}>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-3 min-w-0" style={{ flex: "1 1 55%" }}>
            <div style={{ ...box, minHeight: 72 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1C2340", marginBottom: 6 }}>
                Observation(s) lors de la réception
              </div>
              <div style={{ fontSize: "0.75rem", color: "#555", whiteSpace: "pre-line", minHeight: 36 }}>
                {asString(data.receptionNotes) || " "}
              </div>
            </div>
            <div style={{ ...box, minHeight: 64 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1C2340", marginBottom: 6 }}>
                Nom, signature et date du réceptionnaire
              </div>
              <div style={{ fontSize: "0.78rem", color: "#444" }}>{asString(data.receiverName) || " "}</div>
            </div>
          </div>
          <div className="overflow-hidden flex-shrink-0" style={{ width: 220, borderRadius: 6, border: "1px solid rgba(28,35,64,0.12)" }}>
            {totalRow("SOUS-TOTAL", money(sub), accent)}
            {totalRow(showTax ? "TOTAL HT" : "TOTAL", money(sub), "#1C2340")}
            {showTax ? totalRow(`TVA ${rate}%`, money(tax), "#F3F4F6", "#333") : null}
            {showTax ? totalRow("TOTAL TTC", money(total), accent) : null}
          </div>
        </div>
      </div>

      {footerLines.length > 0 ? (
        <div
          className="px-8 py-3 text-center"
          style={{
            fontSize: "0.68rem",
            color: "#555",
            lineHeight: 1.5,
            borderTop: "1px solid rgba(28,35,64,0.12)",
          }}
        >
          {footerLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      ) : null}
    </Sheet>
  );
}

function formatDateLetter(iso: string) {
  const raw = formatDateFr(iso);
  if (!raw || raw === "—") return "—";
  // « 3 avril 2026 » → « 3 Avril 2026 » (comme sur le modèle Word)
  return raw.replace(/\b([a-zéèêëàâäôöùûüîïç]+)\b/gi, (word, _m, offset) => {
    if (offset === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function SubmissionLetter({ data }: { data: DocData }) {
  const { logo, inHeader } = useDocLogoOptions(data);
  // Filigrane uniquement si l’option est cochée sur la lettre (désactivé par défaut).
  const watermark = asBool(data.showLogoBackground) && logo ? logo : undefined;
  const dateLabel = formatDateLetter(asString(data.date));
  const city = asString(data.city, "Dakar");
  const amount = asString(data.offerAmount).trim() || "………………….";
  const days = asNumber(data.validityDays) > 0 ? String(asNumber(data.validityDays)) : "20";
  const supply = asString(data.supplyDescription, "le matériel et équipements informatique");
  const recipient = asString(data.recipientBlock).trim();
  const salutation = asString(data.salutation, "Monsieur le Directeur,");
  const object = asString(data.object);
  const reference = asString(data.reference);
  const signatory = asString(data.signatory);
  const signatoryTitle = asString(data.signatoryTitle);

  const contactLines = [
    asString(data.companyAddress).trim(),
    asString(data.companyPhone).trim() ? `Tél. ${asString(data.companyPhone).trim()}` : "",
    asString(data.companyEmail).trim() ? `Adresse mail : ${asString(data.companyEmail).trim()}` : "",
    asString(data.companyWebsite).trim() ? `Site internet : ${asString(data.companyWebsite).trim()}` : "",
  ].filter(Boolean);

  return (
    <Sheet accent="#1C2340" watermark={watermark}>
      <div className="px-10 sm:px-12 pt-6 pb-2" style={{ boxSizing: "border-box" }}>
        {inHeader && logo ? (
          <img
            src={logo}
            alt=""
            className="object-contain mb-3"
            style={{ width: 88, height: 88, border: "1px solid rgba(28,35,64,0.15)", borderRadius: 6 }}
          />
        ) : (
          <div
            className="mb-3 flex items-center justify-center text-center"
            style={{
              width: 88,
              height: 88,
              border: "1.5px solid #1C2340",
              borderRadius: 6,
              fontSize: "0.62rem",
              color: "#888",
              lineHeight: 1.3,
              padding: 6,
            }}
          >
            VOTRE
            <br />
            LOGO ICI
          </div>
        )}
        <div style={{ fontSize: "0.72rem", color: "#444", lineHeight: 1.55, whiteSpace: "pre-line" }}>
          {contactLines.length ? contactLines.join("\n") : "—"}
        </div>
      </div>

      <div
        className="px-10 sm:px-12 py-9"
        style={{
          boxSizing: "border-box",
          color: "#1C2340",
          fontSize: "0.92rem",
          lineHeight: 1.7,
          fontFamily: "'Times New Roman', 'Liberation Serif', Georgia, serif",
        }}
      >
        <div style={{ textAlign: "right", marginBottom: 28 }}>Le {dateLabel}</div>

        <h1
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "1.2rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 32,
            fontFamily: "'Times New Roman', 'Liberation Serif', Georgia, serif",
          }}
        >
          LETTRE DE SOUMISSION
        </h1>

        <div
          style={{
            textAlign: "right",
            marginBottom: 28,
            marginLeft: "auto",
            maxWidth: "58%",
            whiteSpace: "pre-line",
          }}
        >
          {recipient || "—"}
        </div>

        <div style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 700 }}>Objet&nbsp;:</span> {object || "—"}
        </div>
        <div style={{ marginBottom: 22 }}>
          <span style={{ fontWeight: 700 }}>Réf&nbsp;:</span> {reference || "—"}
        </div>

        <div style={{ marginBottom: 16 }}>{salutation}</div>

        <p style={{ textAlign: "justify", marginBottom: 14 }}>
          Après avoir examiné le Dossier d&apos;entente directe dont nous vous accusons ici officiellement réception,
          nous, soussignés, offrons de fournir et de livrer {supply} conformément aux spécifications techniques pour
          la somme de {amount} ou autres montants énumérés au Bordereau Descriptif et Quantitatif ci-joint et qui fait
          partie de la présente entente directe.
        </p>

        <p style={{ textAlign: "justify", marginBottom: 14 }}>
          Nous nous engageons, si notre offre est acceptée, à livrer les fournitures selon les dispositions précisées
          dans le Bordereau Descriptif Quantitatif.
        </p>

        <p style={{ textAlign: "justify", marginBottom: 14 }}>
          Nous nous engageons sur les termes de cette offre pour une période de {days} jours à compter de la date
          fixée pour l&apos;ouverture des plis, telle que stipulée dans la Lettre d&apos;invitation ; l&apos;offre
          nous engagera et sera acceptée à tout moment avant la fin de cette période.
        </p>

        <p style={{ textAlign: "justify", marginBottom: 28 }}>
          Jusqu&apos;à ce qu&apos;un marché en bonne et due forme soit préparé et signé, la présente offre complétée
          par la notification d&apos;attribution du marché constituera un marché nous obligeant réciproquement.
        </p>

        <div style={{ textAlign: "right", marginBottom: 48 }}>
          Fait à {city} le {dateLabel}.
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600 }}>Signature</div>
          {signatory ? <div style={{ marginTop: 36 }}>{signatory}</div> : <div style={{ height: 48 }} />}
          {signatoryTitle ? <div style={{ fontSize: "0.85rem", color: "#555" }}>{signatoryTitle}</div> : null}
        </div>
      </div>
    </Sheet>
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
  showClientBand = true,
}: {
  data: DocData;
  title: string;
  showTax: boolean;
  showLegal?: boolean;
  showDueDate?: boolean;
  showObject?: boolean;
  showNotes?: boolean;
  showClientBand?: boolean;
}) {
  const footerLines = buildInvoiceFooterLines(data);
  const accent = useDocHeaderColor(data);
  const footerBg = useDocFooterColor(data);
  const footerFg = headerForeground(footerBg);
  const { watermark } = useDocLogoOptions(data);

  return (
    <Sheet accent={accent} watermark={watermark}>
      <CompanyHead data={data} kicker={title} showLegal={showLegal} />
      {showClientBand ? <ClientBand data={data} showDueDate={showDueDate} showObject={showObject} /> : null}
      <LineTable data={data} showTax={showTax} showNotes={showNotes} />
      {footerLines.length > 0 ? (
        <div
          className="px-8 py-3.5 text-center"
          style={{
            background: footerBg,
            fontSize: "0.72rem",
            color: footerFg,
            lineHeight: 1.55,
            fontWeight: 500,
            letterSpacing: "0.01em",
            borderTop: footerBg === "#FFFFFF" ? "1px solid rgba(28,35,64,0.12)" : undefined,
          }}
        >
          {footerLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      ) : null}
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
  const accent = useDocHeaderColor(data);
  const { watermark } = useDocLogoOptions(data);
  return (
    <Sheet accent={accent} watermark={watermark}>
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
  const accent = useDocHeaderColor(data);
  const { watermark } = useDocLogoOptions(data);
  return (
    <Sheet accent="#B8923A" watermark={watermark}>
      <div className="p-8 space-y-4 min-h-[640px]">
        {blocks.map((b) => {
          if (b.type === "header-band") {
            return (
              <div key={b.id} className="-mx-8 -mt-8 mb-4 px-8 py-6" style={{ background: accent, color: headerForeground(accent) }}>
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

  if (layout === "delivery-note") {
    return <DeliveryNote data={data} />;
  }

  if (layout === "submission-letter") {
    return <SubmissionLetter data={data} />;
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
      const showTax = asBool(data.showTva);
      return (
        <Commercial
          data={data}
          title={titles.invoice}
          showTax={showTax}
          showLegal={asBool(data.showLegal)}
          showDueDate={asBool(data.showDueDate, true)}
          showObject={asBool(data.showObject)}
          showNotes={asBool(data.showNotes, true)}
          showClientBand={asBool(data.showClientBand, true)}
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
        showClientBand={asBool(data.showClientBand, true)}
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
    <GenericFallback data={data} templateName={template.name} />
  );
}

function GenericFallback({ data, templateName }: { data: DocData; templateName: string }) {
  const accent = useDocHeaderColor(data);
  const { watermark } = useDocLogoOptions(data);
  return (
    <Sheet accent={accent} watermark={watermark}>
      <CompanyHead data={data} kicker={templateName} />
      <div className="p-8 text-sm" style={{ color: "#555" }}>
        Aperçu générique — renseignez les champs à gauche.
      </div>
    </Sheet>
  );
}
