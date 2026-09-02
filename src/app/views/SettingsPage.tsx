import { useEffect, useRef, useState } from "react";
import { Building2, CheckCircle2, ImagePlus, Save } from "lucide-react";
import { asCurrency, CURRENCY_OPTIONS, currencyLabel, inp, lbl, type CurrencyCode } from "../lib/helpers";
import { useOrganisme } from "../lib/settings";

type Draft = {
  name: string;
  address: string;
  email: string;
  phone: string;
  currency: CurrencyCode;
};

function draftFromOrganisme(org: ReturnType<typeof useOrganisme>["organisme"]): Draft {
  return {
    name: org.name,
    address: org.address,
    email: org.email,
    phone: org.phone,
    currency: asCurrency(org.currency),
  };
}

export function SettingsPage({ onSaved }: { onSaved?: () => void }) {
  const { organisme, updateOrganisme } = useOrganisme();
  const [draft, setDraft] = useState<Draft>(() => draftFromOrganisme(organisme));
  const [savedOk, setSavedOk] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedCurrency = asCurrency(organisme.currency);

  useEffect(() => {
    setDraft(draftFromOrganisme(organisme));
  }, [organisme.id, organisme.name, organisme.address, organisme.email, organisme.phone, organisme.currency]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const dirty =
    draft.name.trim() !== organisme.name.trim() ||
    draft.address !== organisme.address ||
    draft.email.trim() !== organisme.email.trim() ||
    draft.phone.trim() !== organisme.phone.trim() ||
    draft.currency !== savedCurrency;

  const onLogo = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateOrganisme({ logo: String(reader.result || "") });
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!dirty) return;
    updateOrganisme({
      name: draft.name.trim(),
      address: draft.address,
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      currency: draft.currency,
    });
    setSavedOk(true);
    onSaved?.();
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedOk(false), 4000);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-xl mx-auto">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#1C2340" }}>
          Paramétrage de l’organisme
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#999" }}>
          En-tête des documents (logo, nom, adresse, contacts), devise et identité de votre organisme. L’en-tête s’applique automatiquement à tous les documents et au suivi des dépenses.
        </p>

        {savedOk && (
          <div
            className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(44,95,46,0.12)", color: "#2C5F2E", border: "1px solid rgba(44,95,46,0.25)" }}
            role="status"
          >
            <CheckCircle2 size={18} />
            Paramètres enregistrés — devise : {currencyLabel(draft.currency)}.
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <div className={lbl}>Logo</div>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg border border-border flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: "#F7F6F2" }}
              >
                {organisme.logo ? (
                  <img src={organisme.logo} alt="" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Building2 size={24} style={{ color: "#ccc" }} />
                )}
              </div>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm cursor-pointer hover:bg-muted">
                <ImagePlus size={15} style={{ color: "#B8923A" }} />
                Choisir une image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} />
              </label>
              {organisme.logo ? (
                <button type="button" className="text-xs" style={{ color: "#C0392B" }} onClick={() => updateOrganisme({ logo: "" })}>
                  Retirer
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <div className={lbl}>Nom de l’organisme</div>
            <p className="text-[11px] mb-1.5" style={{ color: "#888" }}>
              Affiché en en-tête sur factures, plannings, comptes rendus, etc.
            </p>
            <input className={inp} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </div>

          <div>
            <label className={lbl}>Adresse</label>
            <textarea
              className={inp}
              rows={2}
              value={draft.address}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>E-mail</label>
              <input
                className={inp}
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </div>
            <div>
              <label className={lbl}>Téléphone</label>
              <input className={inp} value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={lbl} htmlFor="org-currency">
              Devise
            </label>
            <select
              id="org-currency"
              className={inp}
              value={draft.currency}
              onChange={(e) => setDraft((d) => ({ ...d, currency: asCurrency(e.target.value) }))}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({c.hint})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs" style={{ color: savedOk ? "#2C5F2E" : "#888" }}>
              {savedOk
                ? `En vigueur : ${currencyLabel(draft.currency)} — enregistré avec succès.`
                : `En vigueur : ${currencyLabel(savedCurrency)} — factures, documents et dépenses.`}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <span className="text-xs flex-1" style={{ color: dirty ? "#B8923A" : savedOk ? "#2C5F2E" : "#999" }}>
              {savedOk
                ? "Enregistrement réussi."
                : dirty
                  ? "Modifications non enregistrées — cliquez sur Enregistrer pour appliquer."
                  : "Aucune modification. Changez la devise ou un autre champ pour activer Enregistrer."}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={!dirty}
              title={dirty ? undefined : "Modifiez au moins un champ avant d'enregistrer"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: savedOk && !dirty ? "#2C5F2E" : "#1C2340" }}
            >
              {savedOk && !dirty ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {savedOk && !dirty ? "Enregistré" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
