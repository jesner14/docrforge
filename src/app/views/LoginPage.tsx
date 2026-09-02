import { useState, type FormEvent } from "react";
import { loginUser } from "../lib/storage";
import { ApiError } from "../lib/api";
import { inp, lbl } from "../lib/helpers";

export function LoginPage({
  onLogin,
  bootError,
}: {
  onLogin: () => void | Promise<void>;
  bootError?: string | null;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await loginUser(login.trim().toLowerCase(), password);
      await onLogin();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Impossible de se connecter. Vérifiez que le serveur API est démarré.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F7F6F2" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.1rem", fontWeight: 700, color: "#1C2340" }}>
            DocForge
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#B8923A",
              marginTop: 6,
            }}
          >
            Connexion
          </div>
        </div>

        {bootError ? (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B", border: "1px solid rgba(192,57,43,0.2)" }}
          >
            {bootError}
          </div>
        ) : null}

        <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-7 space-y-4">
          <div>
            <label className={lbl}>Identifiant</label>
            <input
              className={inp}
              autoComplete="username"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                setError("");
              }}
            />
          </div>
          <div>
            <label className={lbl}>Mot de passe</label>
            <input
              className={inp}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
          </div>
          {error ? (
            <p className="text-sm" style={{ color: "#C0392B" }}>
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
            style={{ background: "#1C2340" }}
          >
            {submitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
