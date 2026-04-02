"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { createRelationship, deleteRelationship } from "@/actions/graph";

interface RelNode {
  id: string;
  sourceArtifact?: { id: string; displayName: string };
  targetArtifact?: { id: string; displayName: string };
  relationshipType: string;
}

interface ArtifactRelationshipsProps {
  artifactId: string;
  relationsFrom: RelNode[];
  relationsTo: RelNode[];
  canEdit: boolean;
}

const REL_TYPES = [
  { value: "feeds_into", label: "Alimenta (→)" },
  { value: "derived_from", label: "Derivado de (←)" },
  { value: "depends_on", label: "Depende de (→)" },
  { value: "implements", label: "Implementa (→)" },
  { value: "related_to", label: "Relacionado (↔)" },
  { value: "consumed_by", label: "Consumido por (→)" },
];

export function ArtifactRelationships({ artifactId, relationsFrom, relationsTo, canEdit }: ArtifactRelationshipsProps) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [allNodes, setAllNodes] = useState<{ id: string; displayName: string }[]>([]);
  const [targetId, setTargetId] = useState("");
  const [relType, setRelType] = useState("feeds_into");

  useEffect(() => {
    if (isAdding && allNodes.length === 0) {
      // Fetch all nodes for the dropdown
      fetch("/api/artifacts-list")
        .then(res => res.json())
        .then(data => setAllNodes(data.filter((a: any) => a.id !== artifactId)))
        .catch(console.error);
    }
  }, [isAdding, allNodes.length, artifactId]);

  function handleDelete(relId: string) {
    if (!confirm("Remover esta relação?")) return;
    startTransition(async () => {
      await deleteRelationship(relId);
      window.location.reload();
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId) return;
    startTransition(async () => {
      await createRelationship(artifactId, targetId, relType);
      setIsAdding(false);
      window.location.reload();
    });
  }

  const hasRelations = relationsFrom.length > 0 || relationsTo.length > 0;

  return (
    <div className="baba-card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          🔗 Relacionamentos
        </h2>
        {canEdit && !isAdding && (
          <button onClick={() => setIsAdding(true)} className="text-xs baba-button-primary px-2 py-1">
            + Adicionar
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-4 p-3 rounded-lg border flex flex-col gap-2" style={{ borderColor: "var(--border-muted)", background: "var(--bg-card)" }}>
          <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Nova Relação</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
              className="baba-input text-xs py-1"
              style={{ flex: 1 }}
              required
            >
              {REL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="baba-input text-xs py-1"
              style={{ flex: 2 }}
              required
            >
              <option value="">Selecionar artifact de destino...</option>
              {allNodes.map(n => <option key={n.id} value={n.id}>{n.displayName}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={() => setIsAdding(false)} className="text-xs" style={{ color: "var(--text-muted)" }}>Cancelar</button>
            <button type="submit" disabled={isPending || !targetId} className="text-xs baba-button-primary px-3 py-1">
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      {hasRelations ? (
        <div className="flex flex-wrap gap-2">
          {relationsFrom.map((rel) => (
            <div key={rel.id} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-colors group"
              style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-muted)" }}>
              <Link href={`/artifacts/${rel.targetArtifact?.id}`} className="hover:text-white transition-colors">
                → {rel.targetArtifact?.displayName}
                <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>({rel.relationshipType})</span>
              </Link>
              {canEdit && (
                <button onClick={() => handleDelete(rel.id)} disabled={isPending}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-white/10 px-1 rounded">
                  ✕
                </button>
              )}
            </div>
          ))}
          {relationsTo.map((rel) => (
            <div key={rel.id} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-colors group"
              style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-muted)" }}>
              <Link href={`/artifacts/${rel.sourceArtifact?.id}`} className="hover:text-white transition-colors">
                ← {rel.sourceArtifact?.displayName}
                <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>({rel.relationshipType})</span>
              </Link>
              {canEdit && (
                <button onClick={() => handleDelete(rel.id)} disabled={isPending}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-white/10 px-1 rounded">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isAdding && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nenhum relacionamento criado.</p>
      )}
    </div>
  );
}
