import { getArtifacts, getDashboardStats } from "@/actions/artifact";
import { ArtifactCard } from "@/app/(app)/components/ArtifactCard";
import Link from "next/link";

const ARTIFACT_TYPES = [
  { value: "dataset", label: "📊 Tabela / Dataset" },
  { value: "notebook", label: "📓 Notebook" },
  { value: "pipeline", label: "🔄 Pipeline" },
  { value: "dashboard", label: "📈 Dashboard" },
  { value: "process",         label: "⚙️ Processo" },
  { value: "troubleshooting", label: "🔧 Troubleshooting" },
  { value: "rule",            label: "📏 Regra" },
  { value: "decision",        label: "🎯 Decisão" },
  { value: "concept",         label: "💡 Conceito" },
  { value: "glossary",        label: "📖 Glossário" },
  { value: "system",          label: "🖥️ Sistema" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [artifacts, stats] = await Promise.all([
    getArtifacts(params),
    getDashboardStats(),
  ]);

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Catálogo de data products e artefatos documentados
          </p>
        </div>
        <Link href="/artifacts/new" className="baba-button-primary">
          <span>+</span> Novo Artifact
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {[
          { label: "Total",      value: stats.total,                   color: "var(--accent)" },
          { label: "Publicados", value: stats.byStatus.published ?? 0, color: "var(--success)" },
          { label: "Rascunhos",  value: stats.byStatus.draft ?? 0,     color: "var(--text-muted)" },
          { label: "Deprecated", value: stats.byStatus.deprecated ?? 0,color: "var(--warning)" },
        ].map((stat) => (
          <div key={stat.label} className="baba-card p-4">
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-3 mb-6">
        <input
          name="search"
          type="search"
          defaultValue={params.search}
          placeholder="🔍 Buscar artifact..."
          className="baba-input"
          style={{ maxWidth: "280px" }}
        />
        <select name="type" defaultValue={params.type ?? ""} className="baba-select" style={{ maxWidth: "200px" }}>
          <option value="">Todos os tipos</option>
          {ARTIFACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="baba-select" style={{ maxWidth: "180px" }}>
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="deprecated">Deprecated</option>
          <option value="archived">Arquivado</option>
        </select>
        <button type="submit" className="baba-button-secondary">
          Filtrar
        </button>
        {(params.search || params.type || params.status) && (
          <Link href="/" className="baba-button-secondary">
            Limpar
          </Link>
        )}
      </form>

      {/* Grid */}
      {artifacts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ border: "2px dashed var(--border-muted)" }}
        >
          <span className="text-5xl mb-4">📭</span>
          <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>
            Nenhum artifact encontrado
          </p>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {params.search || params.type || params.status
              ? "Tente ajustar os filtros."
              : "Comece criando seu primeiro artifact de documentação."}
          </p>
          {!params.search && !params.type && !params.status && (
            <Link href="/artifacts/new" className="baba-button-primary mt-6">
              + Criar primeiro artifact
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 animate-fade-in">
          {artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} {...artifact} />
          ))}
        </div>
      )}
    </main>
  );
}
