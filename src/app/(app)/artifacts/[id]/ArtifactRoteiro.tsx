"use client";

import { useState, useTransition, useEffect } from "react";
import { FacetEditor } from "./FacetEditor";
import { CommentsSection } from "@/app/(app)/components/CommentsSection";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  CATEGORY_LABELS as CAT_LABELS,
} from "@/lib/labels";
import { canEditFacet } from "@/lib/rbac";
import { approveFacetReplacement, rejectFacetReplacement, getFacetHistory } from "@/actions/facet";

interface Question {
  id: string;
  order: number;
  title: string;
  description: string | null;
  category: string;
  subCategory: string | null;
  priority: string;
  facetType: string;
  effectivePriority: string;
}

interface FacetAuthor {
  id: string;
  name: string | null;
  email: string;
}

interface Facet {
  id: string;
  questionId: string | null;
  contentMarkdown: string | null;
  version: number;
  status: string;
  authorId: string;
  author: FacetAuthor;
  updatedAt: Date;
  createdAt?: Date;
}

interface ArtifactRoteiroProps {
  artifactId: string;
  questions: Question[];
  facets: Facet[];
  complements: Facet[];
  pendingReviews: Facet[];
  userId: string;
  userRole: string;
  artifactType?: string;
}

export function ArtifactRoteiro({ artifactId, questions, facets, complements, pendingReviews, userId, userRole, artifactType }: ArtifactRoteiroProps) {
  const [activeCategory, setActiveCategory] = useState<string>("BUSINESS");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [showNA, setShowNA] = useState(false);
  const [memberAction, setMemberAction] = useState<{ questionId: string; mode: "complement" | "replacement" } | null>(null);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Facet[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const facetMap = new Map(facets.map((f) => [f.questionId, f]));
  const complementsByQuestion = new Map<string, Facet[]>();
  complements.forEach((c) => {
    if (!c.questionId) return;
    const arr = complementsByQuestion.get(c.questionId) ?? [];
    arr.push(c);
    complementsByQuestion.set(c.questionId, arr);
  });
  const pendingByQuestion = new Map<string, Facet[]>();
  pendingReviews.forEach((p) => {
    if (!p.questionId) return;
    const arr = pendingByQuestion.get(p.questionId) ?? [];
    arr.push(p);
    pendingByQuestion.set(p.questionId, arr);
  });

  const categories = ["BUSINESS", "TECHNICAL", "DELIVERY"];
  const filteredQuestions = questions.filter((q) => q.category === activeCategory);
  const applicableQuestions = filteredQuestions.filter((q) => q.effectivePriority !== "NA");
  const naQuestions = filteredQuestions.filter((q) => q.effectivePriority === "NA");
  const subCategories = [...new Set(applicableQuestions.map((q) => q.subCategory ?? ""))];
  const isReviewer = userRole === "admin" || userRole === "editor";

  const countsByCategory = categories.reduce((acc, cat) => {
    const qs = questions.filter((q) => q.category === cat && q.effectivePriority !== "NA");
    const answered = qs.filter((q) => facetMap.has(q.id)).length;
    const naCount = questions.filter((q) => q.category === cat && q.effectivePriority === "NA").length;
    acc[cat] = { total: qs.length, answered, na: naCount };
    return acc;
  }, {} as Record<string, { total: number; answered: number; na: number }>);

  async function loadHistory(questionId: string) {
    if (historyOpen === questionId) {
      setHistoryOpen(null);
      return;
    }
    setHistoryLoading(true);
    setHistoryOpen(questionId);
    try {
      const data = await getFacetHistory(artifactId, questionId);
      setHistoryData(data as any[]);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleApprove(facetId: string) {
    startTransition(async () => {
      await approveFacetReplacement(facetId, artifactId);
    });
  }

  function handleReject(facetId: string) {
    startTransition(async () => {
      await rejectFacetReplacement(facetId, artifactId);
    });
  }

  const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    CURRENT: { label: "Atual", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    COMPLEMENT: { label: "Complemento", color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
    PENDING_REVIEW: { label: "Aguardando Aprovação", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
    ARCHIVED: { label: "Arquivada", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
    REJECTED: { label: "Rejeitada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };

  return (
    <div>
      {/* Category Tabs */}
      <div className="baba-tabs mb-6">
        {categories.map((cat) => {
          const meta = CAT_LABELS[cat];
          const counts = countsByCategory[cat];
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenQuestion(null); }}
              className={`baba-tab ${activeCategory === cat ? "active" : ""}`}
            >
              {meta?.icon} {meta?.label}
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: activeCategory === cat ? "var(--accent-subtle)" : "var(--bg-input)", color: activeCategory === cat ? "var(--accent-text)" : "var(--text-muted)" }}>
                {counts.answered}/{counts.total}
              </span>
              {counts.na > 0 && (
                <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>({counts.na} {PRIORITY_LABELS.NA})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategory Groups */}
      <div className="flex flex-col gap-6">
        {subCategories.map((subCat) => {
          const catQuestions = applicableQuestions.filter((q) => (q.subCategory ?? "") === subCat);
          return (
            <div key={subCat}>
              {subCat && (
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2"
                  style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-muted)" }}>
                  {subCat}
                </h3>
              )}
              <div className="flex flex-col gap-2">
                {catQuestions.map((question) => {
                  const facet = facetMap.get(question.id);
                  const qComplements = complementsByQuestion.get(question.id) ?? [];
                  const qPending = pendingByQuestion.get(question.id) ?? [];
                  const isAnswered = !!facet;
                  const isOpen = openQuestion === question.id;
                  const pColors = PRIORITY_COLORS[question.effectivePriority] ?? PRIORITY_COLORS.NICE;
                  const pLabel = PRIORITY_LABELS[question.effectivePriority] ?? question.effectivePriority;
                  const facetOwnerId = facet?.author?.id ?? facet?.authorId ?? null;
                  const userCanEditCurrent = canEditFacet(userRole, userId, facetOwnerId);
                  const isOtherAuthorMember = isAnswered && facetOwnerId !== userId && userRole === "member";

                  return (
                    <div key={question.id} id={`q${question.order}`} className="rounded-xl overflow-hidden scroll-mt-24"
                      style={{ border: `1px solid ${isOpen ? "var(--accent)" : isAnswered ? "rgba(34,197,94,0.3)" : "var(--border-muted)"}` }}>

                      {/* Header */}
                      <button onClick={() => setOpenQuestion(isOpen ? null : question.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                        style={{ background: isOpen ? "var(--accent-subtle)" : isAnswered ? "rgba(34,197,94,0.05)" : "var(--bg-elevated)" }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: isAnswered ? "rgba(34,197,94,0.2)" : "var(--bg-input)", color: isAnswered ? "var(--success)" : "var(--text-muted)" }}>
                          {isAnswered ? "✓" : question.order}
                        </span>
                        <span className="flex-1 text-sm font-medium text-left" style={{ color: isOpen ? "var(--accent-text)" : "var(--text-primary)" }}>
                          {question.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ background: pColors.bg, color: pColors.text, border: `1px solid ${pColors.border}` }}>
                          {pLabel}
                        </span>
                        {isAnswered && facet && (
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>v{facet.version}</span>
                        )}
                        {(qComplements.length > 0 || qPending.length > 0) && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: qPending.length > 0 ? "rgba(251,191,36,0.15)" : "rgba(59,130,246,0.15)", color: qPending.length > 0 ? "#fbbf24" : "#60a5fa" }}>
                            {qPending.length > 0 ? `⏳${qPending.length}` : `+${qComplements.length}`}
                          </span>
                        )}
                        <span className="flex-shrink-0 transition-transform duration-200"
                          style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                      </button>

                      {/* Content */}
                      {isOpen && (
                        <div className="px-4 py-4 animate-fade-in" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-muted)" }}>

                          {/* Permissão: aviso para membro */}
                          {isOtherAuthorMember && (
                            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs"
                              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>
                              🔒 Resposta de <strong className="mx-1">{facet!.author.name ?? facet!.author.email}</strong> — somente leitura
                            </div>
                          )}

                          {/* Resposta CURRENT */}
                          {userCanEditCurrent ? (
                            <FacetEditor artifactId={artifactId} questionId={question.id} questionTitle={question.title}
                              questionDescription={question.description} facetType={question.facetType}
                              currentContent={facet?.contentMarkdown ?? ""} currentVersion={facet?.version}
                              artifactType={artifactType} />
                          ) : (
                            <>
                              {facet?.contentMarkdown && (
                                <div className="prose-baba" dangerouslySetInnerHTML={{ __html: facet.contentMarkdown }} />
                              )}
                            </>
                          )}

                          {isAnswered && facet && (
                            <div className="mt-3 pt-3 text-xs flex items-center justify-between" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-muted)" }}>
                              <span>Última edição por {facet.author.name ?? facet.author.email}</span>
                              <button onClick={() => loadHistory(question.id)} className="text-xs hover:underline" style={{ color: "var(--accent-text)" }}>
                                {historyOpen === question.id ? "Fechar histórico" : "📜 Histórico"}
                              </button>
                            </div>
                          )}

                          {/* Complementos */}
                          {qComplements.length > 0 && (
                            <div className="mt-4 flex flex-col gap-3">
                              <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#60a5fa" }}>
                                📝 Complementos ({qComplements.length})
                              </h4>
                              {qComplements.map((comp) => (
                                <div key={comp.id} className="rounded-lg p-3" style={{ background: "var(--bg-elevated)", border: "1px solid rgba(59,130,246,0.2)" }}>
                                  {comp.contentMarkdown && (
                                    <div className="prose-baba text-sm" dangerouslySetInnerHTML={{ __html: comp.contentMarkdown }} />
                                  )}
                                  <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                    Complemento por {comp.author.name ?? comp.author.email}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Pending Reviews (para admin/editor) */}
                          {qPending.length > 0 && isReviewer && (
                            <div className="mt-4 flex flex-col gap-3">
                              <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#fbbf24" }}>
                                ⏳ Substituições Pendentes ({qPending.length})
                              </h4>
                              {qPending.map((pf) => (
                                <div key={pf.id} className="rounded-lg p-3" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)" }}>
                                  {pf.contentMarkdown && (
                                    <div className="prose-baba text-sm" dangerouslySetInnerHTML={{ __html: pf.contentMarkdown }} />
                                  )}
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                      Proposta por {pf.author.name ?? pf.author.email}
                                    </span>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleApprove(pf.id)} disabled={isPending}
                                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                        style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                                        ✓ Aprovar
                                      </button>
                                      <button onClick={() => handleReject(pf.id)} disabled={isPending}
                                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                                        ✗ Rejeitar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Pending Reviews (para membros - info apenas) */}
                          {qPending.length > 0 && !isReviewer && (
                            <div className="mt-4 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                              ⏳ Você tem {qPending.length} substituição(ões) aguardando aprovação
                            </div>
                          )}

                          {/* Botões de ação para membros */}
                          {isOtherAuthorMember && !memberAction && (
                            <div className="mt-4 flex gap-2">
                              <button onClick={() => setMemberAction({ questionId: question.id, mode: "complement" })}
                                className="text-xs px-3 py-2 rounded-lg transition-colors"
                                style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
                                + Adicionar Complemento
                              </button>
                              <button onClick={() => setMemberAction({ questionId: question.id, mode: "replacement" })}
                                className="text-xs px-3 py-2 rounded-lg transition-colors"
                                style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                                ⚠️ Propor Substituição
                              </button>
                            </div>
                          )}

                          {/* Editor de Complemento ou Substituição */}
                          {memberAction?.questionId === question.id && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold" style={{ color: memberAction.mode === "replacement" ? "#fbbf24" : "#60a5fa" }}>
                                  {memberAction.mode === "replacement" ? "⚠️ Nova Resposta (requer aprovação)" : "📝 Novo Complemento"}
                                </h4>
                                <button onClick={() => setMemberAction(null)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-muted)" }}>
                                  ✕ Cancelar
                                </button>
                              </div>
                              <FacetEditor artifactId={artifactId} questionId={question.id}
                                questionTitle={memberAction.mode === "replacement" ? `Substituição: ${question.title}` : `Complemento: ${question.title}`}
                                questionDescription={memberAction.mode === "replacement"
                                  ? "Sua resposta será enviada para aprovação de um editor ou admin"
                                  : "Adicione informações complementares à resposta existente"}
                                facetType={question.facetType} currentContent=""
                                isComplement={memberAction.mode === "complement"}
                                submissionMode={memberAction.mode}
                                onSaved={() => setMemberAction(null)} />
                            </div>
                          )}

                          {/* Histórico */}
                          {historyOpen === question.id && (
                            <div className="mt-4 flex flex-col gap-2">
                              <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                📜 Histórico de Respostas
                              </h4>
                              {historyLoading ? (
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Carregando...</div>
                              ) : historyData.length === 0 ? (
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Nenhum histórico encontrado</div>
                              ) : (
                                historyData.map((h) => {
                                  const sm = STATUS_LABELS[h.status] ?? STATUS_LABELS.ARCHIVED;
                                  return (
                                    <div key={h.id} className="rounded-lg p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)", opacity: h.status === "CURRENT" ? 1 : 0.7 }}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: sm.bg, color: sm.color }}>
                                          {sm.label}
                                        </span>
                                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>v{h.version}</span>
                                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>por {h.author?.name ?? h.author?.email ?? "Desconhecido"}</span>
                                      </div>
                                      {h.contentMarkdown && (
                                        <div className="prose-baba text-sm" style={{ maxHeight: "120px", overflow: "hidden" }}
                                          dangerouslySetInnerHTML={{ __html: h.contentMarkdown }} />
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}

                          {/* Comentários */}
                          <CommentsSection artifactId={artifactId} questionId={question.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* NA Questions */}
      {naQuestions.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowNA(!showNA)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-muted)" }}>
            <span style={{ transform: showNA ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
            {naQuestions.length} pergunta{naQuestions.length > 1 ? "s" : ""} N/A
          </button>
          {showNA && (
            <div className="mt-2 flex flex-col gap-1 animate-fade-in">
              {naQuestions.map((q) => (
                <div key={q.id} className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: "var(--bg-elevated)", opacity: 0.5 }}>
                  <span className="text-xs font-mono w-6 text-center" style={{ color: "var(--text-muted)" }}>#{q.order}</span>
                  <span className="text-sm flex-1 line-through" style={{ color: "var(--text-muted)" }}>{q.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(107,114,128,0.15)", color: "#6b7280" }}>{PRIORITY_LABELS.NA}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
