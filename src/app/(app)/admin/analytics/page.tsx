import { getAnalyticsSummary } from "@/actions/admin";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsSummary();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          📈 Analytics de Documentação
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Monitoramento de consultas, tempo de exposição e relevância
        </p>
      </div>

      {/* Total views */}
      <div className="baba-card p-6 mb-6 text-center">
        <div className="text-4xl font-bold" style={{ color: "var(--accent)" }}>
          {data.totalViews}
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Total de visualizações registradas
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Artifacts */}
        <div className="baba-card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-muted)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              📦 Documentações Mais Consultadas
            </h3>
          </div>
          {data.topArtifacts.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhuma visualização registrada ainda
            </div>
          ) : (
            <table className="baba-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Artifact</th>
                  <th>Views</th>
                  <th>Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.topArtifacts.map((item, i) => (
                  <tr key={item.artifact?.id ?? i}>
                    <td className="text-center font-bold" style={{
                      color: i === 0 ? "#fbbf24" : i === 1 ? "#a1a1aa" : i === 2 ? "#cd7f32" : "var(--text-muted)"
                    }}>
                      {i + 1}
                    </td>
                    <td className="font-medium">{item.artifact?.displayName ?? "—"}</td>
                    <td>
                      <span className="baba-badge baba-badge-published">{item.views}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {item.avgDurationMs > 0 ? formatDuration(item.avgDurationMs) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Questions */}
        <div className="baba-card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-muted)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              ❓ Perguntas Mais Consultadas
            </h3>
          </div>
          {data.topQuestions.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhuma visualização de pergunta registrada ainda
            </div>
          ) : (
            <table className="baba-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pergunta</th>
                  <th>Views</th>
                  <th>Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.topQuestions.map((item, i) => (
                  <tr key={item.question?.id ?? i}>
                    <td className="text-center font-bold" style={{
                      color: i === 0 ? "#fbbf24" : i === 1 ? "#a1a1aa" : i === 2 ? "#cd7f32" : "var(--text-muted)"
                    }}>
                      {i + 1}
                    </td>
                    <td>
                      <div className="text-sm font-medium">{item.question?.title ?? "—"}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Pergunta #{item.question?.order}
                      </div>
                    </td>
                    <td>
                      <span className="baba-badge baba-badge-published">{item.views}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {item.avgDurationMs > 0 ? formatDuration(item.avgDurationMs) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Views */}
      <div className="baba-card overflow-hidden mt-6">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-muted)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            🕐 Visualizações Recentes
          </h3>
        </div>
        {data.recentViews.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma visualização recente
          </div>
        ) : (
          <table className="baba-table">
            <thead>
              <tr>
                <th>Artifact</th>
                <th>Pergunta</th>
                <th>Usuário</th>
                <th>Duração</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {data.recentViews.map((view) => (
                <tr key={view.id}>
                  <td className="font-medium">{view.artifact.displayName}</td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {view.question?.title ?? "Visão geral"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {view.user?.name ?? view.user?.email ?? "Anônimo"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {view.durationMs ? formatDuration(view.durationMs) : "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {new Date(view.viewedAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
