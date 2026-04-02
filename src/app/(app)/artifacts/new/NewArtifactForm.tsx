"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createArtifact } from "@/actions/artifact";

const ARTIFACT_TYPES = [
  { value: "dataset", label: "📊 Tabela / Dataset" },
  { value: "notebook", label: "📓 Notebook" },
  { value: "pipeline", label: "🔄 Pipeline" },
  { value: "dashboard", label: "📈 Dashboard" },
  { value: "process",         label: "⚙️ Processo",        desc: "Fluxo de trabalho ou processo operacional" },
  { value: "troubleshooting", label: "🔧 Troubleshooting", desc: "Guia de resolução de problemas" },
  { value: "rule",            label: "📏 Regra",           desc: "Regra de negócio ou validação" },
  { value: "decision",        label: "🎯 Decisão",         desc: "Registro de decisão arquitetural (ADR)" },
  { value: "concept",         label: "💡 Conceito",        desc: "Definição ou conceito do domínio" },
  { value: "glossary",        label: "📖 Glossário",       desc: "Termos e definições do negócio" },
  { value: "system",          label: "🖥️ Sistema",         desc: "Sistema, plataforma ou ferramenta" },
];

interface FormData {
  areas: Array<{ id: string; name: string; organization: { name: string } }>;
  users: Array<{ id: string; name: string | null; email: string }>;
}

export function NewArtifactForm({ formData }: { formData: FormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState("dataset");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createArtifact(fd);
      if ("error" in result) {
        setError(result.error as string);
      } else {
        router.push(`/artifacts/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Tipo */}
      <div>
        <label className="baba-label">Tipo de Artifact</label>
        <div className="grid grid-cols-2 gap-2 mt-1 sm:grid-cols-4">
          {ARTIFACT_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: selectedType === type.value ? "var(--accent-subtle)" : "var(--bg-input)",
                border: `1px solid ${selectedType === type.value ? "var(--accent)" : "var(--border-muted)"}`,
              }}
            >
              <input
                type="radio"
                name="artifactType"
                value={type.value}
                checked={selectedType === type.value}
                onChange={() => setSelectedType(type.value)}
                className="sr-only"
              />
              <span className="text-xl">{type.label.split(" ")[0]}</span>
              <span className="text-xs font-semibold" style={{ color: selectedType === type.value ? "var(--accent-text)" : "var(--text-primary)" }}>
                {type.label.slice(3)}
              </span>
              <span className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
                {type.desc}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Nome canônico */}
      <div>
        <label htmlFor="canonicalName" className="baba-label">
          Nome Canônico <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          id="canonicalName"
          name="canonicalName"
          type="text"
          required
          className="baba-input font-mono"
          placeholder="ex: supply.frequencia_cip.filer"
          pattern="[a-z0-9._\-]+"
          title="Apenas letras minúsculas, números, pontos, underscores e hífens"
        />
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Identificador único, imutável. Use snake_case com hierarquia por ponto.
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="baba-label">
          Nome de Exibição <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          className="baba-input"
          placeholder="ex: FrequenciaCIP - Filer (Enchedora)"
        />
      </div>

      {/* Área */}
      <div>
        <label htmlFor="areaId" className="baba-label">
          Área <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <select id="areaId" name="areaId" required className="baba-select">
          <option value="">Selecione a área...</option>
          {formData.areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.organization.name} › {area.name}
            </option>
          ))}
        </select>
      </div>

      {/* Owner */}
      <div>
        <label htmlFor="ownerId" className="baba-label">
          Responsável (opcional)
        </label>
        <select id="ownerId" name="ownerId" className="baba-select">
          <option value="">Sem responsável definido</option>
          {formData.users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="baba-button-secondary"
          disabled={isPending}
        >
          Cancelar
        </button>
        <button type="submit" className="baba-button-primary" disabled={isPending}>
          {isPending ? "Criando..." : "Criar Artifact →"}
        </button>
      </div>
    </form>
  );
}
