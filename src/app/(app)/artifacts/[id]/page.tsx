import { getArtifactDetail, updateArtifactStatus } from "@/actions/artifact";
import { ArtifactRoteiro } from "./ArtifactRoteiro";
import { ViewTracker } from "@/app/(app)/components/ViewTracker";
import { FavoriteButton } from "@/app/(app)/components/FavoriteButton";
import { ReviewScheduleButton } from "@/app/(app)/components/ReviewScheduleButton";
import { ExportButton } from "@/app/(app)/components/ExportButton";
import { TagSelector } from "@/app/(app)/components/TagSelector";
import { ArtifactRelationships } from "./ArtifactRelationships";
import { isFavorite } from "@/actions/social";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { canChangeArtifactStatus } from "@/lib/rbac";
import Link from "next/link";

const ARTIFACT_TYPE_META: Record<string, { icon: string; label: string }> = {
  dataset: { icon: "📊", label: "Tabela / Dataset" },
  notebook: { icon: "📓", label: "Notebook" },
  pipeline: { icon: "🔄", label: "Pipeline" },
  dashboard: { icon: "📈", label: "Dashboard" },
  process:         { icon: "⚙️", label: "Processo" },
  troubleshooting: { icon: "🔧", label: "Troubleshooting" },
  rule:            { icon: "📏", label: "Regra" },
  decision:        { icon: "🎯", label: "Decisão" },
  concept:         { icon: "💡", label: "Conceito" },
  glossary:        { icon: "📖", label: "Glossário" },
  system:          { icon: "🖥️", label: "Sistema" },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:      { label: "Rascunho",   cls: "baba-badge-draft" },
  published:  { label: "Publicado",  cls: "baba-badge-published" },
  deprecated: { label: "Deprecated", cls: "baba-badge-deprecated" },
  archived:   { label: "Arquivado",  cls: "baba-badge-archived" },
};

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }> = {
  draft:      { label: "✓ Publicar",   next: "published" },
  published:  { label: "⚠ Deprecar",   next: "deprecated" },
  deprecated: { label: "🗃 Arquivar",   next: "archived" },
  archived:   { label: "↩ Restaurar",  next: "draft" },
};

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getArtifactDetail(id);

  if (!data) notFound();

  const session = await auth();
  const userRole = (session?.user as any)?.role ?? "member";
  const userId = session?.user?.id ?? "";
  const canChangeStatus = canChangeArtifactStatus(userRole);

  const { artifact, questions, complements, pendingReviews, documentationScore } = data as any;
  const favStatus = await isFavorite(artifact.id);
  const typeMeta = ARTIFACT_TYPE_META[artifact.artifactType] ?? { icon: "📄", label: artifact.artifactType };
  const statusMeta = STATUS_META[artifact.status] ?? { label: artifact.status, cls: "baba-badge-draft" };
  const statusTransition = canChangeStatus ? STATUS_TRANSITIONS[artifact.status] : null;

  const scoreColor =
    documentationScore >= 80 ? "var(--success)" :
    documentationScore >= 50 ? "var(--warning)" :
    "var(--danger)";

  return (
    <main className="flex-1 p-8">
      {/* View Tracker */}
      <ViewTracker artifactId={artifact.id} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--text-muted)" }}>Dashboard</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>{artifact.displayName}</span>
      </div>

      {/* Artifact Header */}
      <div className="baba-card p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: "var(--bg-input)" }}
          >
            {typeMeta.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {artifact.displayName}
              </h1>
              <span className={`baba-badge ${statusMeta.cls}`}>{statusMeta.label}</span>
              <span
                className="baba-badge"
                style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
              >
                {typeMeta.label}
              </span>
            </div>
            <div className="text-sm font-mono mb-2" style={{ color: "var(--text-muted)" }}>
              {artifact.canonicalName}
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {artifact.area.organization.name} › {artifact.area.name}
              {artifact.owner && ` · ${artifact.owner.name ?? artifact.owner.email}`}
            </div>
            
            {/* Tags */}
            <div className="mt-3 text-sm">
              <TagSelector 
                artifactId={artifact.id} 
                initialTags={artifact.tags ?? []} 
                canEdit={userRole === "admin" || userId === artifact.owner?.id} 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FavoriteButton artifactId={artifact.id} initialFav={favStatus} />
            <ReviewScheduleButton artifactId={artifact.id} />
            <ExportButton artifactId={artifact.id} />
            {/* Duplicate */}
            <form
              action={async () => {
                "use server";
                const { duplicateArtifact } = await import("@/actions/artifact");
                const result = await duplicateArtifact(artifact.id);
                if (result && "id" in result) {
                  const { redirect } = await import("next/navigation");
                  redirect(`/artifacts/${result.id}`);
                }
              }}
            >
              <button type="submit" className="baba-button-secondary text-sm" title="Duplicar artifact">
                📋 Duplicar
              </button>
            </form>

            {statusTransition && (
              <form
                action={async () => {
                  "use server";
                  await updateArtifactStatus(artifact.id, statusTransition.next);
                }}
              >
                <button type="submit" className="baba-button-secondary text-sm">
                  {statusTransition.label}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border-muted)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Score de Documentação
            </span>
            <span className="text-sm font-bold" style={{ color: scoreColor }}>
              {documentationScore}% completo
            </span>
          </div>
          <div className="baba-progress-bar" style={{ height: "6px" }}>
            <div
              className="baba-progress-fill"
              style={{
                width: `${documentationScore}%`,
                background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>
              {artifact.facets.filter((f: any) => f.questionId).length} de{" "}
              {questions.filter((q: any) => q.effectivePriority !== "NA").length} perguntas aplicáveis respondidas
              {questions.some((q: any) => q.effectivePriority === "NA") && (
                <span> ({questions.filter((q: any) => q.effectivePriority === "NA").length} não se aplicam)</span>
              )}
            </span>
            <span>
              {questions.filter((q: any) => q.effectivePriority === "MUST").length -
                artifact.facets.filter((f: any) =>
                  questions.find((q: any) => q.id === f.questionId)?.effectivePriority === "MUST"
                ).length}{" "}
              obrigatórias pendentes
            </span>
          </div>
        </div>

        {/* Tags */}
        {artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {artifact.tags.map(({ tag }: any) => (
              <span
                key={`${tag.category}-${tag.value}`}
                className="text-xs px-2 py-1 rounded-full"
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
          </div>
        )}
      </div>

      {/* Relationships */}
      {/* Relationships */}
      <ArtifactRelationships 
        artifactId={artifact.id}
        relationsFrom={artifact.relationsFrom}
        relationsTo={artifact.relationsTo}
        canEdit={userRole === "admin" || userId === artifact.ownerId}
      />

      {/* Roteiro de Perguntas */}
      <div className="baba-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            📋 Roteiro de Documentação
          </h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {questions.length} perguntas, clique para responder
          </span>
        </div>
        <ArtifactRoteiro
          artifactId={artifact.id}
          questions={questions}
          facets={artifact.facets}
          complements={complements}
          pendingReviews={pendingReviews}
          userId={userId}
          userRole={userRole}
        />
      </div>
    </main>
  );
}
