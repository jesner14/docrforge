import type { ExpenseLine, User } from "../lib/types";
import { expenseTotals, monthLabel } from "../lib/expenses";
import { currencyLabel, formatDateFr, formatMoney, type CurrencyCode } from "../lib/helpers";

export function ExpensePreview({
  user,
  year,
  month,
  lines,
  sealed,
  currency,
}: {
  user: User;
  year: number;
  month: number;
  lines: ExpenseLine[];
  sealed: boolean;
  currency: CurrencyCode;
}) {
  const totals = expenseTotals(lines);
  const money = (n: number) => formatMoney(n, currency);

  return (
    <div
      className="doc-preview-page bg-white rounded-xl shadow-xl overflow-hidden text-sm"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        borderTop: "4px solid #1C2340",
        width: "100%",
        maxWidth: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
      }}
    >
      <div className="p-6" style={{ background: "#1C2340", color: "#fff" }}>
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            {user.companyLogo ? (
              <img src={user.companyLogo} alt="" className="w-12 h-12 object-contain rounded bg-white/10 p-1 flex-shrink-0" />
            ) : null}
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700 }}>{user.company}</div>
              <div style={{ opacity: 0.55, fontSize: "0.72rem", marginTop: 6, lineHeight: 1.5 }}>
                {user.companyAddress}
                <br />
                {user.companyEmail}
                {user.companyPhone ? ` · ${user.companyPhone}` : ""}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div style={{ fontSize: "0.58rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Suivi des dépenses · {currency}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", marginTop: 4 }}>{monthLabel(year, month)}</div>
            <div style={{ fontSize: "0.7rem", color: "#E8C97A", marginTop: 4 }}>{sealed ? "Mois clôturé" : "Mois ouvert"}</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 flex justify-between text-xs" style={{ background: "#F7F6F2", color: "#555" }}>
        <span>
          Établissement : <strong style={{ color: "#1C2340" }}>{user.name}</strong>
        </span>
        <span>Devise : {currencyLabel(currency)}</span>
      </div>

      <div className="px-6 py-4">
        <table className="w-full" style={{ fontSize: "0.72rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1C2340" }}>
              {["Item", "Libellé dépense", "Code reçu", "Date", "Entrée", "Sorties", "Observation"].map((h, i) => (
                <th
                  key={h}
                  className="py-1.5"
                  style={{
                    textAlign: i >= 4 && i <= 5 ? "right" : "left",
                    fontSize: "0.58rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#1C2340",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center" style={{ color: "#aaa" }}>
                  Aucune ligne
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id} style={{ borderBottom: "1px solid rgba(28,35,64,0.06)" }}>
                  <td className="py-1.5 pr-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {line.item}
                  </td>
                  <td className="py-1.5 pr-2">{line.libelle || "—"}</td>
                  <td className="py-1.5 pr-2">{line.codeRecu || "—"}</td>
                  <td className="py-1.5 pr-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {formatDateFr(line.date)}
                  </td>
                  <td className="py-1.5 text-right" style={{ fontFamily: "'DM Mono', monospace", color: "#2C5F2E" }}>
                    {money(line.entree)}
                  </td>
                  <td className="py-1.5 text-right" style={{ fontFamily: "'DM Mono', monospace", color: "#C0392B" }}>
                    {money(line.montant)}
                  </td>
                  <td className="py-1.5 pl-2" style={{ color: "#666" }}>
                    {line.observation || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div style={{ minWidth: 220, fontSize: "0.78rem" }}>
            <div className="flex justify-between py-1" style={{ color: "#777" }}>
              <span>Total entrées</span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: "#2C5F2E" }}>{money(totals.entree)}</span>
            </div>
            <div className="flex justify-between py-1" style={{ color: "#777" }}>
              <span>Total dépenses</span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: "#C0392B" }}>{money(totals.montant)}</span>
            </div>
            <div className="flex justify-between py-2 mt-1" style={{ borderTop: "2px solid #1C2340" }}>
              <span style={{ fontWeight: 700, color: "#1C2340" }}>Solde</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#B8923A" }}>{money(totals.solde)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-2 text-center" style={{ background: "#1C2340", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>
        {user.company} · {monthLabel(year, month)}
      </div>
    </div>
  );
}
