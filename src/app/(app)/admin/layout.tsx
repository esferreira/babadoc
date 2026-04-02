import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessAdmin } from "@/lib/rbac";
import Link from "next/link";

export const metadata = { title: "Administração — Babadoc" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any)?.role ?? "member";
  if (!canAccessAdmin(role)) redirect("/dashboard");

  return (
    <main className="flex-1 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Administração
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Gerenciamento de usuários, perguntas, logs e analytics
        </p>
      </div>

      {/* Tabs */}
      <div className="baba-tabs mb-6">
        <AdminTab href="/admin" label="📊 Visão Geral" />
        <AdminTab href="/admin/users" label="👥 Usuários" />
        <AdminTab href="/admin/questions" label="📋 Perguntas" />
        <AdminTab href="/admin/applicability" label="🎛️ Aplicabilidade" />
        <AdminTab href="/admin/logs" label="📜 Logs" />
        <AdminTab href="/admin/analytics" label="📈 Analytics" />
      </div>

      {children}
    </main>
  );
}

function AdminTab({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="baba-tab">
      {label}
    </Link>
  );
}
