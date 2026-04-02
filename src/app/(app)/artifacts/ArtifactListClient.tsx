"use client";

import { useState, useTransition } from "react";
import { ArtifactCard } from "@/app/(app)/components/ArtifactCard";
import { updateArtifactStatus, deleteArtifact } from "@/actions/artifact";
import { useRouter } from "next/navigation";

interface ArtifactListClientProps {
  initialArtifacts: any[];
}

export function ArtifactListClient({ initialArtifacts }: ArtifactListClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === initialArtifacts.length) {
      setSelectedIds(newSet => { newSet.clear(); return new Set() });
    } else {
      setSelectedIds(new Set(initialArtifacts.map((a) => a.id)));
    }
  };

  const handleBulkStatus = (status: "draft" | "published" | "deprecated" | "archived") => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Alterar status de ${selectedIds.size} artifacts para ${status}?`)) return;

    startTransition(async () => {
      await Promise.all(Array.from(selectedIds).map(id => updateArtifactStatus(id, status)));
      setSelectedIds(new Set());
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja DELETAR ${selectedIds.size} artifacts? Isso não pode ser desfeito.`)) return;

    startTransition(async () => {
      await Promise.all(Array.from(selectedIds).map(id => deleteArtifact(id)));
      setSelectedIds(new Set());
      router.refresh();
    });
  };

  return (
    <div className="relative">
      {/* Select All Bar */}
      {initialArtifacts.length > 0 && (
        <div className="flex items-center gap-3 mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <button onClick={selectAll} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <input 
              type="checkbox" 
              checked={selectedIds.size > 0 && selectedIds.size === initialArtifacts.length} 
              ref={input => {
                if (input) {
                  input.indeterminate = selectedIds.size > 0 && selectedIds.size < initialArtifacts.length;
                }
              }}
              readOnly 
              className="w-4 h-4 cursor-pointer"
              style={{ accentColor: "var(--accent)" }}
            />
            {selectedIds.size === 0 ? "Selecionar todos" : `${selectedIds.size} selecionados`}
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {initialArtifacts.map((artifact) => (
          <ArtifactCard 
            key={artifact.id} 
            {...artifact} 
            selectable={true}
            selected={selectedIds.has(artifact.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full shadow-2xl border animate-slide-up"
          style={{ 
            background: "var(--bg-card)", 
            borderColor: "var(--border-muted)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(212,160,23,0.1)"
          }}
        >
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {selectedIds.size} selecionado{selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkStatus("published")} 
              disabled={isPending}
              className="baba-button-secondary text-xs"
              title="Publicar"
            >
              🚀 Publicar
            </button>
            <button 
              onClick={() => handleBulkStatus("deprecated")} 
              disabled={isPending}
              className="baba-button-secondary text-xs"
              title="Depreciar"
            >
              ⚠️ Depreciar
            </button>
            <button 
              onClick={() => handleBulkStatus("archived")} 
              disabled={isPending}
              className="baba-button-secondary text-xs"
              title="Arquivar"
            >
              📦 Arquivar
            </button>
            <button 
              onClick={handleBulkDelete} 
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              title="Deletar"
            >
              🗑️ Deletar
            </button>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <button onClick={() => setSelectedIds(new Set())} className="text-xl leading-none opacity-50 hover:opacity-100 transition-opacity p-1">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
