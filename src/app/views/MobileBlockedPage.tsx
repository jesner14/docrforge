import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";

export function MobileBlockedPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: "#F7F6F2", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "#1C2340" }}>
          DocForge
        </div>
        <div
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#B8923A",
            marginTop: 6,
            marginBottom: 32,
          }}
        >
          Accès non disponible
        </div>

        <div
          className="rounded-2xl border border-border bg-card p-6 space-y-5"
          style={{ boxShadow: "0 4px 24px rgba(28,35,64,0.06)" }}
        >
          <div className="flex items-center justify-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, background: "rgba(192,57,43,0.08)", color: "#C0392B" }}
            >
              <Smartphone size={24} />
            </div>
            <span style={{ color: "#ccc", fontSize: "1.25rem" }}>→</span>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 44, height: 44, background: "rgba(44,95,46,0.1)", color: "#2C5F2E" }}
              >
                <Tablet size={20} />
              </div>
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 44, height: 44, background: "rgba(28,35,64,0.08)", color: "#1C2340" }}
              >
                <Laptop size={20} />
              </div>
            </div>
          </div>

          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#1C2340",
                marginBottom: 10,
              }}
            >
              Utilisez un ordinateur ou une tablette
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
              DocForge est conçu pour les écrans larges. Pour créer et gérer vos documents, connectez-vous depuis un
              ordinateur ou une tablette.
            </p>
          </div>

          <div
            className="flex items-start gap-2 text-left text-xs rounded-lg px-3 py-2.5"
            style={{ background: "rgba(184,146,58,0.08)", color: "#7a6230" }}
          >
            <Monitor size={14} className="flex-shrink-0 mt-0.5" />
            <span>Largeur minimale recommandée : 768 px (iPad et plus).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
