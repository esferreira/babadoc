"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({ email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: fields.email,
        password: fields.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email ou senha inválidos. Tente novamente.");
      } else {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Left side — Hero image (hidden on mobile) */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          display: "none",
        }}
        className="md:!block"
      >
        <img
          src="/images/login-hero.png"
          alt="Equipe de dados colaborando"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 100%)",
          }}
        />
        {/* Text overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "clamp(24px, 5vh, 48px)",
            left: "clamp(24px, 4vw, 48px)",
            right: "clamp(24px, 4vw, 48px)",
            zIndex: 2,
          }}
        >
          <p
            style={{
              color: "rgba(255,215,0,0.85)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: "clamp(10px, 1.2vw, 13px)",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Data Documentation Platform
          </p>
          <h2
            style={{
              color: "#fff",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 700,
              lineHeight: 1.2,
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}
          >
            Documenta.
            <br />
            <span style={{ color: "#ffd700" }}>Compartilha.</span>
            <br />
            Evolui.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "clamp(11px, 1.1vw, 14px)",
              lineHeight: 1.6,
              marginTop: 12,
              maxWidth: 440,
            }}
          >
            Uma plataforma viva para documentação de produtos de dados, onde
            cada resposta transforma conhecimento tácito em patrimônio.
          </p>
        </div>
      </div>

      {/* Right side — Login form */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "clamp(24px, 5vh, 48px) clamp(20px, 4vw, 40px)",
          background: "var(--bg-base)",
        }}
        className="md:min-w-[420px]"
      >
        <div style={{ width: "100%", maxWidth: 340 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "clamp(24px, 4vh, 40px)" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #d4a017, #b8860b)",
                boxShadow: "0 4px 24px rgba(212,160,23,0.3)",
                marginBottom: 16,
              }}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3a3 3 0 106 0 3 3 0 00-6 0z"
                  fill="#0a0a0a"
                />
              </svg>
            </div>

            <p
              style={{
                color: "var(--text-muted)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontSize: 10,
                marginBottom: 8,
              }}
            >
              Welcome to the
            </p>
            <h1
              style={{
                fontSize: "clamp(24px, 3vw, 32px)",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Baba<span style={{ color: "#d4a017" }}>doc</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
              Plataforma de documentação de data products
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" className="baba-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={fields.email}
                onChange={handleChange}
                placeholder="seu@empresa.com"
                className="baba-input"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="password" className="baba-label">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={fields.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="baba-input"
                disabled={isPending}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="baba-button-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "10px 16px",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {isPending ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 24 }}>
            Problemas de acesso? Contate o administrador.
          </p>

          <div style={{ textAlign: "center", marginTop: "clamp(24px, 4vh, 48px)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Plataforma de Documentação
            </span>
          </div>
        </div>
      </div>

      {/* Responsive: on mobile, hero hidden, form takes full width */}
      <style>{`
        @media (min-width: 768px) {
          .md\\:min-w-\\[420px\\] { min-width: 420px !important; }
          .md\\:!block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
