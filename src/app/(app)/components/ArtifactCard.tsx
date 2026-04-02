import Link from "next/link";

const ARTIFACT_TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  dataset: { icon: "📊", label: "Tabela / Dataset", color: "#10B981" },
  notebook: { icon: "📓", label: "Notebook", color: "#F59E0B" },
  pipeline: { icon: "🔄", label: "Pipeline", color: "#3B82F6" },
  dashboard: { icon: "📈", label: "Dashboard", color: "#F2C811" },
  process:         { icon: "⚙️", label: "Processo",        color: "#3b82f6" },
  troubleshooting: { icon: "🔧", label: "Troubleshooting", color: "#f59e0b" },
  rule:            { icon: "📏", label: "Regra",           color: "#10b981" },
  decision:        { icon: "🎯", label: "Decisão",         color: "#ec4899" },
  concept:         { icon: "💡", label: "Conceito",        color: "#8b5cf6" },
  glossary:        { icon: "📖", label: "Glossário",       color: "#06b6d4" },
  system:          { icon: "🖥️", label: "Sistema",         color: "#78716c" },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:      { label: "Rascunho",   cls: "baba-badge-draft" },
  published:  { label: "Publicado",  cls: "baba-badge-published" },
  deprecated: { label: "Deprecated", cls: "baba-badge-deprecated" },
  archived:   { label: "Arquivado",  cls: "baba-badge-archived" },
};

interface ArtifactCardProps {
  id: string;
  canonicalName: string;
  displayName: string;
  artifactType: string;
  status: string;
  documentationScore: number;
  area: { name: string; organization: { name: string } };
  owner?: { name: string | null; email: string } | null;
  tags: Array<{ tag: { category: string; value: string; color: string | null; icon: string | null } }>;
  updatedAt: Date;
  _count?: { viewLogs: number };
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

export function ArtifactCard({
  id,
  canonicalName,
  displayName,
  artifactType,
  status,
  documentationScore,
  area,
  owner,
  tags,
  _count,
  updatedAt,
  selectable,
  selected,
  onSelect,
}: ArtifactCardProps) {
  const typeMeta = ARTIFACT_TYPE_META[artifactType] ?? { icon: "📄", label: artifactType, color: "#71717a" };
  const statusMeta = STATUS_META[status] ?? { label: status, cls: "baba-badge-draft" };
  const views = _count?.viewLogs ?? 0;

  const scoreColor =
    documentationScore >= 80 ? "var(--success)" :
    documentationScore >= 50 ? "var(--warning)" :
    "var(--danger)";

  return (
    <Link
      href={`/artifacts/${id}`}
      className="baba-card block p-5 group"
      style={{ textDecoration: "none" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          {selectable && (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSelect) onSelect(id);
              }}
              className="mt-1 mr-1 cursor-pointer flex-shrink-0"
            >
              <input 
                type="checkbox" 
                checked={selected} 
                onChange={() => {}} 
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: "var(--accent)" }}
              />
            </div>
          )}
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: `${typeMeta.color}22` }}
          >
            {typeMeta.icon}
          </span>
          <div className="min-w-0">
            <div
              className="text-xs font-mono truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {canonicalName}
            </div>
            <div
              className="text-sm font-semibold truncate group-hover:text-[--accent] transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              {displayName}
            </div>
          </div>
        </div>
        <span className={`baba-badge ${statusMeta.cls} flex-shrink-0`}>
          {statusMeta.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Documentação
          </span>
          <span className="text-xs font-semibold" style={{ color: scoreColor }}>
            {documentationScore}%
          </span>
        </div>
        <div className="baba-progress-bar">
          <div
            className="baba-progress-fill"
            style={{
              width: `${documentationScore}%`,
              background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)`,
            }}
          />
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 4).map(({ tag }) => (
            <span
              key={`${tag.category}-${tag.value}`}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: tag.color ? `${tag.color}20` : "var(--bg-input)",
                color: tag.color ?? "var(--text-muted)",
                border: `1px solid ${tag.color ? `${tag.color}40` : "var(--border-muted)"}`,
              }}
            >
              {tag.icon && <span className="mr-1">{tag.icon}</span>}
              {tag.value}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--text-muted)", background: "var(--bg-input)" }}>
              +{tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>
          {area.organization.name} · {area.name}
        </span>
        <div className="flex items-center gap-2">
          {owner && (
            <span>{owner.name ?? owner.email}</span>
          )}
          <span title="Visualizações">👁 {views}</span>
          <span>{timeAgo(updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
