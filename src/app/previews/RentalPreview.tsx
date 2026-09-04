import type { RentalLine, User } from "../lib/types";
import { deriveRentalStatus, resolveDateRemiseCaisse, monthLabel, prolongementStatusColor, rentalEcart, rentalTotals, statusColor } from "../lib/rentals";
import { currencyLabel, formatDateFr, formatMoney, type CurrencyCode } from "../lib/helpers";

export function RentalPreview({
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
  lines: RentalLine[];
  sealed: boolean;
  currency: CurrencyCode;
}) {
  const totals = rentalTotals(lines);
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
              Suivi des locations · {currency}
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

      <div className="px-4 py-4 overflow-x-auto">
        <table className="w-full" style={{ fontSize: "0.58rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1C2340" }}>
              {[
                "N°",
                "Date",
                "Client",
                "Véhicule",
                "Immat.",
                "Jours",
                "À payer",
                "Encaissé",
                "Livreur",
                "Remise caisse",
                "Écart",
                "Stat. loc.",
                "Nb prol.",
                "Stat. prol.",
                "Mt prol. enc.",
                "Paiement",
                "Obs.",
                "État",
              ].map((h, i) => (
                  <th
                    key={h}
                    className="py-1.5 px-1"
                    style={{
                      textAlign: [5, 6, 7, 10, 12, 14].includes(i) ? "right" : "left",
                      fontSize: "0.48rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#1C2340",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-6 text-center" style={{ color: "#999" }}>
                  Aucune location
                </td>
              </tr>
            ) : (
              lines.map((line, i) => {
                const statut = line.statut || deriveRentalStatus(line);
                const statutProl = line.statutProlongement || "—";
                return (
                  <tr key={line.id} style={{ background: i % 2 ? "#F7F6F2" : "#fff", borderBottom: "1px solid rgba(28,35,64,0.05)" }}>
                    <td className="py-1.5 px-1">{line.numero}</td>
                    <td className="py-1.5 px-1 whitespace-nowrap">{formatDateFr(line.date)}</td>
                    <td className="py-1.5 px-1">{line.client || "—"}</td>
                    <td className="py-1.5 px-1">{line.vehicule || "—"}</td>
                    <td className="py-1.5 px-1 whitespace-nowrap">{line.immatriculation || "—"}</td>
                    <td className="py-1.5 px-1 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {line.jours || 0}
                    </td>
                    <td className="py-1.5 px-1 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {money(line.montantAPayer)}
                    </td>
                    <td className="py-1.5 px-1 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {money(line.montantEncaisse)}
                    </td>
                    <td className="py-1.5 px-1">{line.livreur || "—"}</td>
                    <td className="py-1.5 px-1 whitespace-nowrap">
                      {formatDateFr(resolveDateRemiseCaisse(line))}
                    </td>
                    <td className="py-1.5 px-1 text-right font-semibold" style={{ fontFamily: "'DM Mono', monospace", color: rentalEcart(line) > 0 ? "#C0392B" : "#2C5F2E" }}>
                      {money(rentalEcart(line))}
                    </td>
                    <td className="py-1.5 px-1">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: statusColor(statut) + "18", color: statusColor(statut) }}>
                        {statut}
                      </span>
                    </td>
                    <td className="py-1.5 px-1 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {line.nbProlongements || 0}
                    </td>
                    <td className="py-1.5 px-1">
                      {line.statutProlongement ? (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                          style={{
                            background: prolongementStatusColor(line.statutProlongement) + "18",
                            color: prolongementStatusColor(line.statutProlongement),
                          }}
                        >
                          {statutProl}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-1.5 px-1 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {money(line.montantProlongementEncaisse || 0)}
                    </td>
                    <td className="py-1.5 px-1">{line.modePaiement || "—"}</td>
                    <td className="py-1.5 px-1">{line.observation || "—"}</td>
                    <td className="py-1.5 px-1">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{
                          background: line.sealed ? "rgba(192,57,43,0.12)" : "rgba(44,95,46,0.12)",
                          color: line.sealed ? "#C0392B" : "#2C5F2E",
                        }}
                      >
                        {line.sealed ? "Clôturée" : "Ouverte"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 pb-6">
        <div className="flex justify-end">
          <div style={{ minWidth: 240 }}>
            <div className="flex justify-between py-1 text-xs" style={{ color: "#777", borderTop: "1px solid rgba(28,35,64,0.08)" }}>
              <span>Total à payer</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>{money(totals.aPayer)}</span>
            </div>
            <div className="flex justify-between py-1 text-xs" style={{ color: "#777" }}>
              <span>Total encaissé</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>{money(totals.encaisse)}</span>
            </div>
            <div className="flex justify-between py-2 mt-1" style={{ borderTop: "2px solid #1C2340" }}>
              <span style={{ fontWeight: 700, color: "#1C2340" }}>Écart restant</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: totals.ecart > 0 ? "#C0392B" : "#2C5F2E" }}>
                {money(totals.ecart)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 text-center" style={{ background: "#1C2340", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
        {user.company} · Suivi des locations et paiements
      </div>
    </div>
  );
}
