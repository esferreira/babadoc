import { getArtifacts } from "@/actions/artifact";
import { ArtifactListClient } from "./ArtifactListClient";
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

export default async function ArtifactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const artifacts = await getArtifacts(params);

  return (
    <main className="flex-1 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Artifacts
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""} encontrado{artifacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/artifacts/new" className="baba-button-primary">
          <span>+</span> Novo Artifact
        </Link>
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-3 mb-6">
        <input
          name="search"
          type="search"
          defaultValue={params.search}
          placeholder="🔍 Buscar..."
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
        <button type="submit" className="baba-button-secondary">Filtrar</button>
        {(params.search || params.type || params.status) && (
          <Link href="/artifacts" className="baba-button-secondary">Limpar</Link>
        )}
      </form>

      {artifacts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ border: "2px dashed var(--border-muted)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Nenhum artifact encontrado</span>
          <Link href="/artifacts/new" className="baba-button-primary mt-6">+ Criar artifact</Link>
        </div>
      ) : (
        <ArtifactListClient initialArtifacts={artifacts} />
      )}
    </main>
  );
}
