import { useEffect, useRef, useState } from "react";
import { Building2, CheckCircle2, ImagePlus, Save } from "lucide-react";
import { asCurrency, CURRENCY_OPTIONS, currencyLabel, inp, lbl, asHeaderColor, asFooterColor, asHeaderNameAlign, asLogoScale, headerForeground, HEADER_COLOR_PRESETS, DEFAULT_HEADER_COLOR, DEFAULT_FOOTER_COLOR, type CurrencyCode, type HeaderNameAlign, type LogoScale } from "../lib/helpers";
import { useOrganisme } from "../lib/settings";

type Draft = {
  name: string;
  address: string;
  email: string;
  phone: string;
  currency: CurrencyCode;
  ninea: string;
  rc: string;
  rib: string;
  website: string;
  slogan: string;
  headerColor: string;
  footerColor: string;
  logoInHeader: boolean;
  logoAsBackground: boolean;
  headerNameAlign: HeaderNameAlign;
  logoAlign: HeaderNameAlign;
  logoScale: LogoScale;
  showHeaderDocRef: boolean;
};

function draftFromOrganisme(org: ReturnType<typeof useOrganisme>["organisme"]): Draft {
  return {
    name: org.name,
    address: org.address,
    email: org.email,
    phone: org.phone,
    currency: asCurrency(org.currency),
    ninea: org.ninea || "",
    rc: org.rc || "",
    rib: org.rib || "",
    website: org.website || "",
    slogan: org.slogan || "",
    headerColor: asHeaderColor(org.headerColor),
    footerColor: asFooterColor(org.footerColor),
    logoInHeader: org.logoInHeader !== false,
    logoAsBackground: !!org.logoAsBackground,
    headerNameAlign: asHeaderNameAlign(org.headerNameAlign),
    logoAlign: asHeaderNameAlign(org.logoAlign),
    logoScale: asLogoScale(org.logoScale),
    showHeaderDocRef: org.showHeaderDocRef !== false,
  };
}

export function SettingsPage({ onSaved }: { onSaved?: () => void }) {
  const { organisme, updateOrganisme } = useOrganisme();
  const [draft, setDraft] = useState<Draft>(() => draftFromOrganisme(organisme));
  const [savedOk, setSavedOk] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedCurrency = asCurrency(organisme.currency);
  const savedHeaderColor = asHeaderColor(organisme.headerColor);
  const savedFooterColor = asFooterColor(organisme.footerColor);

  useEffect(() => {
    setDraft(draftFromOrganisme(organisme));
  }, [
    organisme.id,
    organisme.name,
    organisme.address,
    organisme.email,
    organisme.phone,
    organisme.currency,
    organisme.ninea,
    organisme.rc,
    organisme.rib,
    organisme.website,
    organisme.slogan,
    organisme.headerColor,
    organisme.footerColor,
    organisme.logoInHeader,
    organisme.logoAsBackground,
    organisme.headerNameAlign,
    organisme.logoAlign,
    organisme.logoScale,
    organisme.showHeaderDocRef,
  ]);

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
    (draft.ninea || "").trim() !== (organisme.ninea || "").trim() ||
    (draft.rc || "").trim() !== (organisme.rc || "").trim() ||
    (draft.rib || "").trim() !== (organisme.rib || "").trim() ||
    (draft.website || "").trim() !== (organisme.website || "").trim() ||
    (draft.slogan || "").trim() !== (organisme.slogan || "").trim() ||
    asHeaderColor(draft.headerColor) !== savedHeaderColor ||
    asFooterColor(draft.footerColor) !== savedFooterColor ||
    draft.logoInHeader !== (organisme.logoInHeader !== false) ||
    draft.logoAsBackground !== !!organisme.logoAsBackground ||
    draft.headerNameAlign !== asHeaderNameAlign(organisme.headerNameAlign) ||
    draft.logoAlign !== asHeaderNameAlign(organisme.logoAlign) ||
    draft.logoScale !== asLogoScale(organisme.logoScale) ||
    draft.showHeaderDocRef !== (organisme.showHeaderDocRef !== false) ||
    draft.currency !== savedCurrency;

  const onLogo = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateOrganisme({ logo: String(reader.result || "") });
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setSaveError(null);
    setSavedOk(false);
    try {
      await updateOrganisme({
        name: draft.name.trim(),
        address: draft.address.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        currency: draft.currency,
        ninea: draft.ninea.trim(),
        rc: draft.rc.trim(),
        rib: draft.rib.trim(),
        website: draft.website.trim(),
        slogan: draft.slogan.trim(),
        headerColor: asHeaderColor(draft.headerColor),
        footerColor: asFooterColor(draft.footerColor),
        logoInHeader: draft.logoInHeader,
        logoAsBackground: draft.logoAsBackground,
        headerNameAlign: draft.headerNameAlign,
        logoAlign: draft.logoAlign,
        logoScale: draft.logoScale,
        showHeaderDocRef: draft.showHeaderDocRef,
      });
      setSavedOk(true);
      onSaved?.();
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedOk(false), 4000);
    } catch (err) {
      console.error(err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Enregistrement impossible. Vérifiez que l’API est démarrée, puis réessayez."
      );
    } finally {
      setSaving(false);
    }
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
        {saveError && (
          <div
            className="mt-4 px-4 py-3 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(192,57,43,0.1)", color: "#C0392B", border: "1px solid rgba(192,57,43,0.3)" }}
            role="alert"
          >
            {saveError}
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
            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.logoInHeader}
                  onChange={(e) => setDraft((d) => ({ ...d, logoInHeader: e.target.checked }))}
                  disabled={!organisme.logo}
                />
                <span>
                  <span className="text-sm font-semibold" style={{ color: "#1C2340" }}>
                    Afficher le logo dans l’en-tête
                  </span>
                  <span className="block text-[11px]" style={{ color: "#888" }}>
                    Affiche le logo dans le bandeau (position réglable ci-dessous).
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.logoAsBackground}
                  onChange={(e) => setDraft((d) => ({ ...d, logoAsBackground: e.target.checked }))}
                  disabled={!organisme.logo}
                />
                <span>
                  <span className="text-sm font-semibold" style={{ color: "#1C2340" }}>
                    Logo en fond de page
                  </span>
                  <span className="block text-[11px]" style={{ color: "#888" }}>
                    Filigrane centré sur les documents, opacité 10&nbsp;%.
                  </span>
                </span>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className={lbl}>Position du logo</div>
                <p className="text-[11px] mb-2" style={{ color: "#888" }}>
                  Indépendante du nom (ex. logo à gauche, nom à droite).
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "left" as const, label: "À gauche" },
                      { value: "right" as const, label: "À droite" },
                    ] as const
                  ).map((opt) => {
                    const active = draft.logoAlign === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={!draft.logoInHeader || !organisme.logo}
                        onClick={() => setDraft((d) => ({ ...d, logoAlign: opt.value }))}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-40"
                        style={{
                          background: active ? "#1C2340" : "#fff",
                          color: active ? "#fff" : "#1C2340",
                          borderColor: active ? "#1C2340" : "rgba(28,35,64,0.15)",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className={lbl}>Position du client</div>
                <p className="text-[11px] mb-2" style={{ color: "#888" }}>
                  Nom et adresse du destinataire de la facture (gauche ou droite).
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "left" as const, label: "À gauche" },
                      { value: "right" as const, label: "À droite" },
                    ] as const
                  ).map((opt) => {
                    const active = draft.headerNameAlign === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, headerNameAlign: opt.value }))}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                        style={{
                          background: active ? "#1C2340" : "#fff",
                          color: active ? "#fff" : "#1C2340",
                          borderColor: active ? "#1C2340" : "rgba(28,35,64,0.15)",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className={lbl}>Taille du logo</div>
              <p className="text-[11px] mb-2" style={{ color: "#888" }}>
                Agrandit le logo dans l’en-tête des documents (×1 = taille actuelle).
              </p>
              <div className="flex gap-2">
                {([1, 2, 3, 4] as const).map((scale) => {
                  const active = draft.logoScale === scale;
                  return (
                    <button
                      key={scale}
                      type="button"
                      disabled={!draft.logoInHeader || !organisme.logo}
                      onClick={() => setDraft((d) => ({ ...d, logoScale: scale }))}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-40"
                      style={{
                        background: active ? "#1C2340" : "#fff",
                        color: active ? "#fff" : "#1C2340",
                        borderColor: active ? "#1C2340" : "rgba(28,35,64,0.15)",
                      }}
                    >
                      ×{scale}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={draft.showHeaderDocRef}
                onChange={(e) => setDraft((d) => ({ ...d, showHeaderDocRef: e.target.checked }))}
              />
              <span>
                <span className="text-sm font-semibold" style={{ color: "#1C2340" }}>
                  Afficher type et numéro dans l’en-tête
                </span>
                <span className="block text-[11px]" style={{ color: "#888" }}>
                  Ex. « Facture · FCFA » et « #2026-090 ».
                </span>
              </span>
            </label>
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
            <p className="text-[11px] mb-1.5" style={{ color: "#888" }}>
              Adresse complète (jusqu’à 200 caractères et plus). Affichable en pied de facture.
            </p>
            <textarea
              className={inp}
              rows={3}
              maxLength={500}
              value={draft.address}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            />
            <p className="mt-1 text-[10px]" style={{ color: "#aaa" }}>
              {draft.address.length}/500
            </p>
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
              <label className={lbl}>Téléphone (TEL)</label>
              <input className={inp} value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>NINEA</label>
              <input
                className={inp}
                value={draft.ninea}
                placeholder="Ex. 0XXXXXXX2A2"
                onChange={(e) => setDraft((d) => ({ ...d, ninea: e.target.value }))}
              />
            </div>
            <div>
              <label className={lbl}>RC</label>
              <input
                className={inp}
                value={draft.rc}
                placeholder="Registre de commerce"
                onChange={(e) => setDraft((d) => ({ ...d, rc: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>RIB</label>
            <input
              className={inp}
              value={draft.rib}
              placeholder="IBAN / RIB"
              onChange={(e) => setDraft((d) => ({ ...d, rib: e.target.value }))}
            />
          </div>

          <div>
            <label className={lbl}>Site web</label>
            <input
              className={inp}
              value={draft.website}
              placeholder="https://www.exemple.com"
              onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
            />
          </div>

          <div>
            <label className={lbl}>Slogan (pied de page)</label>
            <p className="text-[11px] mb-1.5" style={{ color: "#888" }}>
              Dernière ligne du pied de facture, entre guillemets.
            </p>
            <input
              className={inp}
              value={draft.slogan}
              placeholder="Notre expertise à votre service"
              onChange={(e) => setDraft((d) => ({ ...d, slogan: e.target.value }))}
            />
          </div>

          <div>
            <div className={lbl}>Couleur d’en-tête</div>
            <p className="text-[11px] mb-2" style={{ color: "#888" }}>
              Bandeau en haut des factures et autres documents (logo, nom, contacts).
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {HEADER_COLOR_PRESETS.map((p) => {
                const active = asHeaderColor(draft.headerColor) === p.value.toUpperCase();
                const isLight = p.value === "#FFFFFF" || p.value === "#F5C518";
                return (
                  <button
                    key={p.value}
                    type="button"
                    title={p.label}
                    onClick={() => setDraft((d) => ({ ...d, headerColor: p.value }))}
                    className="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-105"
                    style={{
                      background: p.value,
                      borderColor: active ? "#B8923A" : isLight ? "rgba(28,35,64,0.25)" : "rgba(28,35,64,0.12)",
                      boxShadow: active ? "0 0 0 2px rgba(184,146,58,0.35)" : undefined,
                    }}
                    aria-label={p.label}
                    aria-pressed={active}
                  />
                );
              })}
              <label
                className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden"
                style={{ borderColor: "rgba(28,35,64,0.2)", background: draft.headerColor }}
                title="Couleur personnalisée"
              >
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={asHeaderColor(draft.headerColor)}
                  onChange={(e) => setDraft((d) => ({ ...d, headerColor: e.target.value }))}
                />
              </label>
            </div>
            <div
              className="rounded-lg px-4 py-3"
              style={{
                background: asHeaderColor(draft.headerColor),
                color: headerForeground(draft.headerColor),
                border: asHeaderColor(draft.headerColor) === "#FFFFFF" ? "1px solid rgba(28,35,64,0.12)" : undefined,
              }}
            >
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "0.95rem" }}>
                {draft.name.trim() || "Aperçu en-tête"}
              </div>
              <div style={{ opacity: 0.55, fontSize: "0.7rem", marginTop: 4 }}>
                {draft.address.trim() || "Adresse"}
                {draft.phone.trim() ? ` · ${draft.phone.trim()}` : ""}
              </div>
            </div>
            <button
              type="button"
              className="mt-2 text-[11px] font-semibold"
              style={{ color: "#888" }}
              onClick={() => setDraft((d) => ({ ...d, headerColor: DEFAULT_HEADER_COLOR }))}
            >
              Réinitialiser (bleu nuit)
            </button>
          </div>

          <div>
            <div className={lbl}>Couleur du pied de page</div>
            <p className="text-[11px] mb-2" style={{ color: "#888" }}>
              Bandeau en bas des factures (nom, adresse, NINEA, etc.).
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {HEADER_COLOR_PRESETS.map((p) => {
                const active = asFooterColor(draft.footerColor) === p.value.toUpperCase();
                const isLight = p.value === "#FFFFFF" || p.value === "#F5C518";
                return (
                  <button
                    key={p.value}
                    type="button"
                    title={p.label}
                    onClick={() => setDraft((d) => ({ ...d, footerColor: p.value }))}
                    className="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-105"
                    style={{
                      background: p.value,
                      borderColor: active ? "#B8923A" : isLight ? "rgba(28,35,64,0.25)" : "rgba(28,35,64,0.12)",
                      boxShadow: active ? "0 0 0 2px rgba(184,146,58,0.35)" : undefined,
                    }}
                    aria-label={p.label}
                    aria-pressed={active}
                  />
                );
              })}
              <label
                className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden"
                style={{ borderColor: "rgba(28,35,64,0.2)", background: draft.footerColor }}
                title="Couleur personnalisée"
              >
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={asFooterColor(draft.footerColor)}
                  onChange={(e) => setDraft((d) => ({ ...d, footerColor: e.target.value }))}
                />
              </label>
            </div>
            <div
              className="rounded-lg px-4 py-2.5 text-center text-xs font-medium"
              style={{
                background: asFooterColor(draft.footerColor),
                color: headerForeground(draft.footerColor),
                border: asFooterColor(draft.footerColor) === "#FFFFFF" ? "1px solid rgba(28,35,64,0.12)" : undefined,
              }}
            >
              {(draft.name.trim() || "Organisme") +
                (draft.address.trim() ? ` · ${draft.address.trim()}` : "") +
                (draft.phone.trim() ? ` · TEL: ${draft.phone.trim()}` : "")}
            </div>
            <button
              type="button"
              className="mt-2 text-[11px] font-semibold"
              style={{ color: "#888" }}
              onClick={() => setDraft((d) => ({ ...d, footerColor: DEFAULT_FOOTER_COLOR }))}
            >
              Réinitialiser (bleu pied)
            </button>
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
              disabled={!dirty || saving}
              title={dirty ? undefined : "Modifiez au moins un champ avant d'enregistrer"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: savedOk && !dirty ? "#2C5F2E" : "#1C2340" }}
            >
              {savedOk && !dirty ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {saving ? "Enregistrement…" : savedOk && !dirty ? "Enregistré" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
