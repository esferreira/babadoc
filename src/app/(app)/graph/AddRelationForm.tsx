"use client";

import { useState, useTransition } from "react";
import { createRelationship } from "@/actions/graph";
import { useRouter } from "next/navigation";

const REL_TYPES = [
  { value: "feeds_into", label: "Alimenta (→)" },
  { value: "derived_from", label: "Derivado de (←)" },
  { value: "depends_on", label: "Depende de" },
  { value: "implements", label: "Implementa" },
  { value: "related_to", label: "Relacionado" },
  { value: "consumed_by", label: "Consumido por" },
];

interface Node {
  id: string;
  displayName: string;
}

export function AddRelationForm({ nodes }: { nodes: Node[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [type, setType] = useState("related_to");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!source || !target || source === target) return;

    startTransition(async () => {
      await createRelationship(source, target, type);
      setSource("");
      setTarget("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="baba-button-primary text-sm mb-4"
      >
        + Nova Relação
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="baba-card p-4 mb-4 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--accent-text)" }}>
          + Nova Relação
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <label className="baba-label">Origem</label>
          <select value={source} onChange={e => setSource(e.target.value)} required className="baba-select">
            <option value="">Selecionar...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.displayName}</option>)}
          </select>
        </div>
        <div>
          <label className="baba-label">Tipo de Relação</label>
          <select value={type} onChange={e => setType(e.target.value)} className="baba-select">
            {REL_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="baba-label">Destino</label>
          <select value={target} onChange={e => setTarget(e.target.value)} required className="baba-select">
            <option value="">Selecionar...</option>
            {nodes.filter(n => n.id !== source).map(n => <option key={n.id} value={n.id}>{n.displayName}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={isPending || !source || !target} className="baba-button-primary text-sm w-full">
            {isPending ? "..." : "Criar"}
          </button>
        </div>
      </div>

      {source && target && source === target && (
        <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>Origem e destino devem ser diferentes</p>
      )}
    </form>
  );
}
