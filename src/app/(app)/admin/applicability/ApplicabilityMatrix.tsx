"use client";

import { useState, useTransition } from "react";
import { updateApplicability } from "@/actions/applicability";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  ARTIFACT_TYPE_LABELS,
} from "@/lib/labels";

interface Question {
  id: string;
  order: number;
  title: string;
  category: string;
  priority: string; // default priority
}

interface Props {
  questions: Question[];
  matrix: Record<string, Record<string, string>>;
}

const ARTIFACT_TYPES = Object.entries(ARTIFACT_TYPE_LABELS).map(([key, val]) => ({
  key,
  label: val.label,
  icon: val.icon,
}));

export function ApplicabilityMatrix({ questions, matrix }: Props) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredQuestions = filter
    ? questions.filter((q) => q.category === filter)
    : questions;

  function handleChange(questionId: string, artifactType: string, value: string) {
    startTransition(async () => {
      await updateApplicability(questionId, artifactType, value);
      setFeedback(`Salvo ✓`);
      setTimeout(() => setFeedback(null), 2000);
    });
  }

  function getEffective(questionId: string, artifactType: string): string {
    return matrix[questionId]?.[artifactType] ?? "DEFAULT";
  }

  function getDisplayPriority(questionId: string, artifactType: string): string {
    const override = matrix[questionId]?.[artifactType];
    if (override) return override;
    return questions.find((q) => q.id === questionId)?.priority ?? "NICE";
  }

  // Stats
  const stats = ARTIFACT_TYPES.map((type) => {
    const applicable = questions.filter((q) => getDisplayPriority(q.id, type.key) !== "NA").length;
    const must = questions.filter((q) => getDisplayPriority(q.id, type.key) === "MUST").length;
    return { ...type, applicable, must, na: questions.length - applicable };
  });

  return (
    <div>
      {feedback && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm animate-fade-in"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}>
          {feedback}
        </div>
      )}

      {/* Type summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.key} className="baba-card p-3">
            <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              {s.icon} {s.label}
            </div>
            <div className="flex gap-2 text-xs">
              <span style={{ color: "#ef4444" }}>{s.must} {PRIORITY_LABELS.MUST}</span>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <span style={{ color: "var(--text-secondary)" }}>{s.applicable} aplicáveis</span>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <span style={{ color: "#6b7280" }}>{s.na} {PRIORITY_LABELS.NA}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("")} className={`baba-tab ${!filter ? "active" : ""}`}>
          Todas ({questions.length})
        </button>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`baba-tab ${filter === cat ? "active" : ""}`}
            style={filter === cat ? { borderColor: color, color } : {}}
          >
            {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <div className="baba-card overflow-x-auto">
        <table className="baba-table" style={{ minWidth: "900px" }}>
          <thead>
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th style={{ minWidth: "220px" }}>Pergunta</th>
              <th style={{ width: "60px" }}>Padrão</th>
              {ARTIFACT_TYPES.map((t) => (
                <th key={t.key} className="text-center" style={{ width: "80px", fontSize: "10px" }}>
                  <div>{t.icon}</div>
                  <div>{t.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q) => (
              <tr key={q.id} style={{ opacity: isPending ? 0.7 : 1 }}>
                <td className="text-center font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {q.order}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[q.category] }}
                    />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {q.title}
                    </span>
                  </div>
                </td>
                <td className="text-center">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: PRIORITY_COLORS[q.priority]?.bg,
                      color: PRIORITY_COLORS[q.priority]?.text,
                    }}
                  >
                    {PRIORITY_LABELS[q.priority] ?? q.priority}
                  </span>
                </td>
                {ARTIFACT_TYPES.map((type) => {
                  const effective = getEffective(q.id, type.key);
                  const displayed = getDisplayPriority(q.id, type.key);
                  const colors = PRIORITY_COLORS[displayed];
                  return (
                    <td key={type.key} className="text-center">
                      <select
                        value={effective}
                        onChange={(e) => handleChange(q.id, type.key, e.target.value)}
                        disabled={isPending}
                        className="text-xs rounded px-1 py-0.5 border-none cursor-pointer text-center"
                        style={{
                          background: colors?.bg ?? "transparent",
                          color: colors?.text ?? "var(--text-muted)",
                          width: "65px",
                        }}
                      >
                        <option value="DEFAULT">{PRIORITY_LABELS[q.priority]}*</option>
                        <option value="MUST">{PRIORITY_LABELS.MUST}</option>
                        <option value="NICE">{PRIORITY_LABELS.NICE}</option>
                        <option value="NA">{PRIORITY_LABELS.NA}</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl p-4" style={{ background: "var(--bg-input)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          <strong>Legenda:</strong> Valores com * usam o padrão da pergunta. Altere para sobrescrever por tipo de artefato.
          <br /> <strong style={{ color: "#ef4444" }}>{PRIORITY_LABELS.MUST}</strong> = preenchimento obrigatório · <strong style={{ color: "#f59e0b" }}>{PRIORITY_LABELS.NICE}</strong> = preenchimento desejável · <strong style={{ color: "#6b7280" }}>{PRIORITY_LABELS.NA}</strong> = pergunta excluída do roteiro e do score
        </p>
      </div>
    </div>
  );
}
