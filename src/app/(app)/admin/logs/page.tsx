import { getAuditLogs } from "@/actions/admin";
import Link from "next/link";

const ACTION_COLORS: Record<string, string> = {
  create: "#22c55e",
  update: "#3b82f6",
  delete: "#ef4444",
  soft_delete: "#f59e0b",
  publish: "#8b5cf6",
  restore: "#06b6d4",
};

const ACTION_ICONS: Record<string, string> = {
  create: "➕",
  update: "✏️",
  delete: "🗑️",
  soft_delete: "🚮",
  publish: "📢",
  restore: "♻️",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s atrás`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const { logs, total, pages } = await getAuditLogs({
    entityType: params.entityType,
    action: params.action,
    page,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          📜 Logs de Auditoria ({total} registros)
        </h2>
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-3 mb-4">
        <select name="entityType" defaultValue={params.entityType ?? ""} className="baba-select" style={{ maxWidth: "160px" }}>
          <option value="">Todas entidades</option>
          <option value="artifact">Artifact</option>
          <option value="facet">Facet</option>
          <option value="question">Pergunta</option>
          <option value="user">Usuário</option>
          <option value="tag">Tag</option>
        </select>
        <select name="action" defaultValue={params.action ?? ""} className="baba-select" style={{ maxWidth: "160px" }}>
          <option value="">Todas ações</option>
          <option value="create">Criar</option>
          <option value="update">Atualizar</option>
          <option value="delete">Deletar</option>
          <option value="soft_delete">Soft Delete</option>
          <option value="publish">Publicar</option>
          <option value="restore">Restaurar</option>
        </select>
        <button type="submit" className="baba-button-secondary text-sm">Filtrar</button>
        {(params.entityType || params.action) && (
          <Link href="/admin/logs" className="baba-button-secondary text-sm">Limpar</Link>
        )}
      </form>

      {/* Log Entries */}
      {logs.length === 0 ? (
        <div className="baba-card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          <p className="text-3xl mb-2">📭</p>
          <p>Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="baba-card p-4 flex items-start gap-3"
            >
              {/* Action Icon */}
              <span
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: `${ACTION_COLORS[log.action] ?? "#71717a"}20` }}
              >
                {ACTION_ICONS[log.action] ?? "📝"}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Action badge */}
                  <span
                    className="baba-badge"
                    style={{
                      background: `${ACTION_COLORS[log.action] ?? "#71717a"}20`,
                      color: ACTION_COLORS[log.action] ?? "#71717a",
                    }}
                  >
                    {log.action}
                  </span>

                  {/* Entity type badge */}
                  <span className="baba-badge" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                    {log.entityType}
                  </span>

                  {/* Artifact link */}
                  {log.artifact && (
                    <Link
                      href={`/artifacts/${log.artifactId}`}
                      className="text-xs hover:underline"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {log.artifact.displayName}
                    </Link>
                  )}
                </div>

                {/* Detail */}
                {log.detail && (
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {log.detail}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>
                    {log.user ? (log.user.name ?? log.user.email) : "Sistema"}
                  </span>
                  <span>•</span>
                  <span>{timeAgo(log.performedAt)}</span>
                  <span>•</span>
                  <span>{new Date(log.performedAt).toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/logs?entityType=${params.entityType ?? ""}&action=${params.action ?? ""}&page=${p}`}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: p === page ? "var(--accent)" : "var(--bg-input)",
                color: p === page ? "white" : "var(--text-secondary)",
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
