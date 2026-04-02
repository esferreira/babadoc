"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  artifacts: "Artifacts",
  admin: "Administração",
  help: "Ajuda",
  about: "Sobre",
  new: "Novo",
  users: "Usuários",
  questions: "Perguntas",
  logs: "Logs",
  tags: "Tags",
  coverage: "Cobertura",
  graph: "Grafo",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] ?? (seg.length > 20 ? seg.slice(0, 18) + "…" : seg);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav
      className="flex items-center gap-1.5 text-xs mb-4 px-1"
      style={{ color: "var(--text-muted)" }}
      aria-label="Breadcrumbs"
    >
      <Link href="/dashboard" className="hover:underline" style={{ color: "var(--text-muted)" }}>
        🏠
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-1.5">
          <span style={{ opacity: 0.4 }}>/</span>
          {c.isLast ? (
            <span style={{ color: "var(--accent-text)", fontWeight: 600 }}>{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:underline" style={{ color: "var(--text-muted)" }}>
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
