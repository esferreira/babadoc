import { getUserProfileData } from "@/actions/profile";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Meu Perfil — Babadoc" };

export default async function ProfilePage() {
  const data = await getUserProfileData();

  if (!data || !data.user) {
    notFound();
  }

  const { user, artifactsOwned, recentFacets, stats } = data;

  return (
    <main className="flex-1 p-8" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header Profile */}
      <div className="flex items-center gap-6 mb-10">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
          style={{ background: "var(--accent)", color: "var(--bg-base)" }}
        >
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {user.name ?? "Sábio do Babadoc"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          <div className="mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
            Papel: {user.role.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Estatísticas de Contribuição</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: "📦", label: "Artifacts Criados", value: stats.artifacts, color: "var(--info)" },
          { icon: "✏️", label: "Respostas Fornecidas", value: stats.facets, color: "var(--success)" },
          { icon: "💬", label: "Comentários", value: stats.comments, color: "var(--warning)" },
          { icon: "⭐", label: "Favoritos Salvos", value: stats.favorites, color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className="baba-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-1">{s.icon}</span>
            <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Meus Artifacts */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            📦 Meus Artifacts
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
              {artifactsOwned.length} recentes
            </span>
          </h2>
          {artifactsOwned.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum artifact criado ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {artifactsOwned.map((art: any) => (
                <Link key={art.id} href={`/artifacts/${art.id}`} className="baba-card p-4 transition-transform hover:-translate-y-1 block">
                  <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{art.displayName}</h3>
                  <p className="text-xs font-mono truncate mt-1" style={{ color: "var(--text-muted)" }}>{art.canonicalName}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-1">👁️ {art._count.viewLogs}</span>
                    <span className="flex items-center gap-1">⭐ {art._count.favorites}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5">{art.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Minhas Respostas Recentes */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            ✏️ Respostas Recentes
          </h2>
          {recentFacets.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma resposta dada ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentFacets.map((facet: any) => (
                <Link key={facet.id} href={`/artifacts/${facet.artifact.id}`} className="baba-card p-4 transition-transform hover:-translate-y-1 block">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--accent-text)" }}>
                    {facet.artifact.displayName}
                  </div>
                  <h3 className="text-sm font-semibold line-clamp-2" style={{ color: "var(--text-primary)" }}>
                    {facet.question?.title ?? "Resposta Sem Pergunta"}
                  </h3>
                  <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(facet.updatedAt).toLocaleDateString("pt-BR")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
