"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { FavoritesList } from "./FavoritesList";

const ARTIFACT_TYPES: Record<string, { icon: string; label: string }> = {
  dataset: { icon: "📊", label: "Tabela / Dataset" },
  notebook: { icon: "📓", label: "Notebook" },
  pipeline: { icon: "🔄", label: "Pipeline" },
  dashboard: { icon: "📈", label: "Dashboard" },
  process:         { icon: "⚙️", label: "Processo" },
  troubleshooting: { icon: "🔧", label: "Troubleshooting" },
  rule:            { icon: "📏", label: "Regra" },
  decision:        { icon: "🎯", label: "Decisão" },
  concept:         { icon: "💡", label: "Conceito" },
  glossary:        { icon: "📖", label: "Glossário" },
  system:          { icon: "🖥️", label: "Sistema" },
};

const navItems = [
  { href: "/dashboard", icon: "▦", label: "Dashboard" },
  { href: "/artifacts", icon: "📁", label: "Artifacts" },
  { href: "/coverage", icon: "📊", label: "Cobertura" },
  { href: "/graph", icon: "🕸️", label: "Grafo" },
  { href: "/reviews", icon: "📅", label: "Revisões" },
  { href: "/template", icon: "📄", label: "Gerar Template" },
];

interface SidebarProps {
  userName: string;
  userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAdmin = userRole === "admin";

  // Fechar sidebar ao navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  function handleAdminClick(e: React.MouseEvent) {
    if (!isAdmin) {
      e.preventDefault();
      setShowPermissionPopup(true);
      setTimeout(() => setShowPermissionPopup(false), 3500);
    }
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-4 border-b" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-muted)" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded text-white text-xs font-bold" style={{ background: "var(--accent)" }}>B</div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>BABADOC</span>
        </div>
        <button onClick={() => setIsMobileOpen(true)} className="p-2 -mr-2 text-xl" style={{ color: "var(--text-muted)" }}>
          ☰
        </button>
      </div>

      {/* Overlay */}
      <div 
        className={`baba-sidebar-overlay ${isMobileOpen ? "open" : ""}`} 
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`baba-sidebar ${isMobileOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="px-4 py-5 border-b flex justify-between items-center" style={{ borderColor: "var(--border-muted)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
              style={{ background: "var(--accent)" }}
            >
              B
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Babadoc
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Data Documentation
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-2" style={{ color: "var(--text-muted)" }}>
            Navegação
          </div>

          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`baba-nav-item ${isActive ? "active" : ""}`}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div className="h-px my-3" style={{ background: "var(--border-muted)" }} />

          <Link
            href="/artifacts/new"
            className="baba-button-primary w-full justify-center text-sm"
            style={{ padding: "8px 12px" }}
          >
            <span>+</span> Novo Artifact
          </Link>

          {/* Favoritos */}
          <FavoritesList />

          {/* Admin link — com popup de permissão para não-admins */}
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-2" style={{ color: "var(--text-muted)" }}>
              Sistema
            </div>
            {isAdmin ? (
              <Link
                href="/admin"
                className={`baba-nav-item ${pathname.startsWith("/admin") ? "active" : ""}`}
              >
                <span style={{ fontSize: "16px" }}>⚙️</span>
                Administração
              </Link>
            ) : (
              <button
                onClick={handleAdminClick}
                className="baba-nav-item w-full text-left"
                style={{ opacity: 0.5 }}
              >
                <span style={{ fontSize: "16px" }}>🔒</span>
                Administração
              </button>
            )}
            <Link
              href="/help"
              className={`baba-nav-item ${pathname === "/help" ? "active" : ""}`}
            >
              <span style={{ fontSize: "16px" }}>❓</span>
              Ajuda
            </Link>
            <Link
              href="/about"
              className={`baba-nav-item ${pathname === "/about" ? "active" : ""}`}
            >
              <span style={{ fontSize: "16px" }}>ℹ️</span>
              Sobre
            </Link>
          </div>
        </nav>
      </aside>

      {/* Permission denied popup */}
      {showPermissionPopup && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in"
          style={{
            background: "linear-gradient(135deg, #1a1a1a, #141414)",
            border: "1px solid rgba(212,160,23,0.4)",
            borderRadius: "12px",
            padding: "16px 24px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(212,160,23,0.08)",
            maxWidth: "420px",
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "24px" }}>🔒</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#fca5a5" }}>
                Acesso Restrito
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                A área de Administração é exclusiva para usuários com perfil <strong style={{ color: "var(--accent-text)" }}>Administrador</strong>.
                Entre em contato com o administrador do sistema para solicitar acesso.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { ARTIFACT_TYPES };
