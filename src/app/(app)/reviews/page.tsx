import { getPendingReviewsList } from "@/actions/review";
import { ReviewList } from "./ReviewList";
import Link from "next/link";

export const metadata = { title: "Revisões — Babadoc" };

const TYPE_ICONS: Record<string, string> = {
  dataset: "📊", notebook: "📓", pipeline: "🔄", dashboard: "📈", process: "⚙️", troubleshooting: "🔧",
  rule: "📏", decision: "🎯", concept: "💡", glossary: "📖", system: "🖥️",
};

function daysFromNow(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function ReviewsPage() {
  const { overdue, upcoming } = await getPendingReviewsList();

  return (
    <main className="flex-1 p-8" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            📅 Revisão Periódica
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Artifacts que requerem revisão para manter a documentação atualizada
          </p>
        </div>
      </div>

      {/* Overdue */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--danger)" }} />
          <span style={{ color: "var(--danger)" }}>Atrasadas ({overdue.length})</span>
        </h2>
        {overdue.length === 0 ? (
          <div className="baba-card p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            ✅ Nenhuma revisão atrasada!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {overdue.map((rs: any) => (
              <div key={rs.id} className="baba-card p-4 flex items-center gap-4" style={{ borderLeft: "3px solid var(--danger)" }}>
                <span className="text-lg">{TYPE_ICONS[rs.artifact.artifactType] ?? "📄"}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/artifacts/${rs.artifact.id}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                    {rs.artifact.displayName}
                  </Link>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {rs.artifact.canonicalName} · A cada {rs.frequencyDays} dias
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: "var(--danger)" }}>
                    {Math.abs(daysFromNow(rs.nextReviewAt))}d atrasada
                  </span>
                </div>
                <ReviewList artifactId={rs.artifact.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent)" }} />
          <span style={{ color: "var(--accent-text)" }}>Próximas ({upcoming.length})</span>
        </h2>
        {upcoming.length === 0 ? (
          <div className="baba-card p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma revisão agendada. Configure a frequência nos artifacts.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((rs: any) => {
              const days = daysFromNow(rs.nextReviewAt);
              const isUrgent = days <= 7;
              return (
                <div key={rs.id} className="baba-card p-4 flex items-center gap-4">
                  <span className="text-lg">{TYPE_ICONS[rs.artifact.artifactType] ?? "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/artifacts/${rs.artifact.id}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                      {rs.artifact.displayName}
                    </Link>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      A cada {rs.frequencyDays} dias
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      background: isUrgent ? "rgba(239,68,68,0.1)" : "var(--accent-subtle)",
                      color: isUrgent ? "var(--danger)" : "var(--accent-text)",
                    }}
                  >
                    em {days}d
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
