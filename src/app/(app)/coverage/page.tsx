import { getCoverageByArea } from "@/actions/artifact";
import Link from "next/link";

export const metadata = { title: "Cobertura — Babadoc" };

export default async function CoveragePage() {
  const areas = await getCoverageByArea();
  const sorted = [...areas].sort((a, b) => b.artifactCount - a.artifactCount);
  const globalScore = areas.length > 0
    ? Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length)
    : 0;

  return (
    <main className="flex-1 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            📊 Cobertura de Documentação
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Visão geral do progresso de documentação por área
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: globalScore >= 80 ? "var(--success)" : globalScore >= 50 ? "var(--warning)" : "var(--danger)" }}>
            {globalScore}%
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Score Global</div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <p className="text-5xl mb-4">📭</p>
          <p>Nenhuma área cadastrada</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((area) => {
            const scoreColor = area.score >= 80 ? "var(--success)" : area.score >= 50 ? "var(--warning)" : "var(--danger)";
            return (
              <div key={area.id} className="baba-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {area.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {area.organization}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: scoreColor }}>
                      {area.score}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="baba-progress-bar mb-3">
                  <div
                    className="baba-progress-fill"
                    style={{ width: `${area.score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{area.artifactCount} artifact{area.artifactCount !== 1 ? "s" : ""}</span>
                  <span>{area.answeredCount}/{area.possibleCount} respostas</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
