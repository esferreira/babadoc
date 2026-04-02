import { prisma } from "@/lib/db";

export default async function AdminOverviewPage() {
  const [userCount, artifactCount, questionCount, facetCount, logCount, viewCount] = await Promise.all([
    prisma.user.count(),
    prisma.artifact.count(),
    (prisma as any).question.count({ where: { isActive: true } }),
    (prisma as any).facet.count({ where: { isDeleted: false, status: "CURRENT" } }),
    (prisma as any).auditLog.count(),
    (prisma as any).viewLog.count(),
  ]);

  const stats = [
    { icon: "👥", label: "Usuários",     value: userCount,     color: "var(--accent)" },
    { icon: "📦", label: "Artifacts",    value: artifactCount, color: "var(--info)" },
    { icon: "📋", label: "Perguntas",    value: questionCount, color: "var(--warning)" },
    { icon: "✏️", label: "Respostas",    value: facetCount,    color: "var(--success)" },
    { icon: "📜", label: "Logs",         value: logCount,      color: "#8b5cf6" },
    { icon: "👁️", label: "Visualizações",value: viewCount,     color: "#ec4899" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="baba-card p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Gestão</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/admin/tags" className="baba-card p-5 flex items-center gap-4 hover:bg-white/5 transition-colors group">
          <div className="text-3xl group-hover:scale-110 transition-transform">🏷️</div>
          <div>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Tags</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Gerenciar domínios, zonas e tecnologias</p>
          </div>
        </a>
      </div>
    </div>
  );
}
