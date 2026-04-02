"use client";

import { useState, useTransition } from "react";
import { createQuestion, updateQuestion, toggleQuestionActive } from "@/actions/admin";
import { PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/labels";

interface Question {
  id: string;
  order: number;
  title: string;
  description: string | null;
  category: string;
  subCategory: string | null;
  priority: string;
  facetType: string;
  isActive: boolean;
}

const CATEGORIES = ["BUSINESS", "TECHNICAL", "DELIVERY"] as const;
const PRIORITIES = ["MUST", "NICE"] as const;
const FACET_TYPES = [
  "business_overview","technical_spec","lineage","troubleshooting","schema","rules",
  "frequency","usage","glossary","history","contacts","pipeline","sla","dependencies",
  "consumers","infrastructure","walkthrough","connection","rls","ids",
];

export function QuestionsTable({ questions: initialQuestions }: { questions: Question[] }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const filteredQuestions = filter
    ? initialQuestions.filter((q) => q.category === filter)
    : initialQuestions;

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createQuestion(fd);
      if ("error" in res) setError(res.error ?? "Erro desconhecido");
      else { setSuccess("Pergunta criada!"); setShowForm(false); setTimeout(() => setSuccess(null), 3000); }
    });
  }

  function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateQuestion(id, fd);
      if ("error" in res) setError(res.error ?? "Erro desconhecido");
      else { setEditingId(null); setSuccess("Pergunta atualizada!"); setTimeout(() => setSuccess(null), 3000); }
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleQuestionActive(id);
      if ("error" in res) setError(res.error ?? "Erro desconhecido");
    });
  }

  const categoryColors = CATEGORY_COLORS;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          📋 Gerenciar Perguntas ({initialQuestions.filter((q) => q.isActive).length} ativas / {initialQuestions.length} total)
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="baba-button-primary text-sm">
          {showForm ? "Cancelar" : "+ Nova Pergunta"}
        </button>
      </div>

      {(error || success) && (
        <div className="rounded-lg px-4 py-2 text-sm mb-4 animate-fade-in" style={{
          background: error ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
          color: error ? "#f87171" : "#4ade80",
        }}>
          {error || success}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("")} className={`baba-tab ${!filter ? "active" : ""}`}>Todas</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`baba-tab ${filter === c ? "active" : ""}`}
            style={filter === c ? { borderColor: categoryColors[c], color: categoryColors[c] } : {}}
          >
            {CATEGORY_LABELS[c]?.icon} {CATEGORY_LABELS[c]?.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="baba-card p-5 mb-4 grid grid-cols-2 gap-4 animate-fade-in">
          <div className="col-span-2">
            <label className="baba-label">Título *</label>
            <input name="title" required className="baba-input" placeholder="Ex: Quem é o responsável pelo dado?" />
          </div>
          <div className="col-span-2">
            <label className="baba-label">Descrição</label>
            <textarea name="description" className="baba-input" rows={2} placeholder="Detalhes adicionais..." />
          </div>
          <div>
            <label className="baba-label">Categoria *</label>
            <select name="category" required className="baba-select">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]?.label ?? c}</option>)}
            </select>
          </div>
          <div>
            <label className="baba-label">Sub-categoria</label>
            <input name="subCategory" className="baba-input" placeholder="Ex: 1.1 Contexto e Definição" />
          </div>
          <div>
            <label className="baba-label">Prioridade *</label>
            <select name="priority" required className="baba-select">
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="baba-label">Tipo de Facet *</label>
            <select name="facetType" required className="baba-select">
              {FACET_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={isPending} className="baba-button-primary">
              {isPending ? "Criando..." : "Criar Pergunta"}
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      <div className="flex flex-col gap-2">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className="baba-card p-4"
            style={{ opacity: q.isActive ? 1 : 0.5 }}
          >
            {editingId === q.id ? (
              <form onSubmit={(e) => handleUpdate(q.id, e)} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input name="title" defaultValue={q.title} required className="baba-input text-sm" />
                </div>
                <div className="col-span-2">
                  <textarea name="description" defaultValue={q.description ?? ""} className="baba-input text-sm" rows={2} />
                </div>
                <select name="category" defaultValue={q.category} className="baba-select text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]?.label ?? c}</option>)}
                </select>
                <input name="subCategory" defaultValue={q.subCategory ?? ""} className="baba-input text-sm" placeholder="Sub-categoria" />
                <select name="priority" defaultValue={q.priority} className="baba-select text-sm">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
                <select name="facetType" defaultValue={q.facetType} className="baba-select text-sm">
                  {FACET_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="col-span-2 flex gap-2">
                  <button type="submit" disabled={isPending} className="baba-button-primary text-xs">Salvar</button>
                  <button type="button" onClick={() => setEditingId(null)} className="baba-button-secondary text-xs">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono w-8 text-center flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  #{q.order}
                </span>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: categoryColors[q.category] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {q.title}
                  </div>
                  {q.description && (
                    <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {q.description}
                    </div>
                  )}
                </div>
                <span className="baba-badge text-xs" style={{
                  background: PRIORITY_COLORS[q.priority]?.bg ?? "rgba(245,158,11,0.15)",
                  color: PRIORITY_COLORS[q.priority]?.text ?? "#f59e0b",
                }}>
                  {PRIORITY_LABELS[q.priority] ?? q.priority}
                </span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                  {q.facetType}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditingId(q.id)} className="text-xs px-2 py-1 rounded"
                    style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                    ✏️
                  </button>
                  <button onClick={() => handleToggle(q.id)} disabled={isPending}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: q.isActive ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      color: q.isActive ? "#f87171" : "#4ade80",
                    }}>
                    {q.isActive ? "🚫" : "✅"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
