"use client";

import { useState, useEffect, useTransition } from "react";
import { getAllTags, updateArtifactTags } from "@/actions/tag";

interface TagLabel {
  id: string;
  category: string;
  value: string;
  color: string | null;
  icon: string | null;
}

interface TagSelectorProps {
  artifactId: string;
  initialTags: { tag: TagLabel }[];
  canEdit: boolean;
}

export function TagSelector({ artifactId, initialTags, canEdit }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<TagLabel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialTags.map(t => t.tag.id))
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && allTags.length === 0) {
      getAllTags().then(tags => setAllTags(tags));
    }
  }, [open, allTags.length]);

  function toggleSelection(tagId: string) {
    const next = new Set(selectedIds);
    if (next.has(tagId)) {
      next.delete(tagId);
    } else {
      next.add(tagId);
    }
    setSelectedIds(next);
  }

  function handleSave() {
    startTransition(async () => {
      await updateArtifactTags(artifactId, Array.from(selectedIds));
      setOpen(false);
    });
  }

  // Tags que estão renderizadas no momento (se estiver fechado, as iniciais, ou as atualizadas pelo BD via startTransition)
  // Mas para não complicar com optimistic updates longos, o initialTags vai vir atualizado pelo Server Component pós-revalidate.

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex flex-wrap items-center gap-2">
        {initialTags.map(t => (
          <span
            key={t.tag.id}
            className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5"
            style={{ 
              background: "var(--bg-input)", 
              border: `1px solid ${t.tag.color ?? "var(--border-muted)"}`, 
              color: t.tag.color ?? "var(--text-primary)" 
            }}
          >
            {t.tag.icon && <span>{t.tag.icon}</span>}
            {t.tag.value}
          </span>
        ))}

        {initialTags.length === 0 && !canEdit && (
          <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Sem tags</span>
        )}

        {canEdit && (
          <button
            onClick={() => setOpen(!open)}
            className="text-xs px-2 py-0.5 rounded-full hover:bg-white/5 transition-colors"
            style={{ border: "1px dashed var(--text-muted)", color: "var(--text-muted)" }}
          >
            {open ? "Fechar" : "+ Tags"}
          </button>
        )}
      </div>

      {open && (
        <div 
          className="absolute z-50 top-full left-0 mt-2 p-4 rounded-xl shadow-xl animate-fade-in"
          style={{ 
            background: "var(--bg-card)", 
            border: "1px solid var(--border-muted)",
            width: 320,
            maxHeight: 400,
            overflowY: "auto"
          }}
        >
          <div className="flex justify-between items-center mb-4 pb-2" style={{ borderBottom: "1px solid var(--border-muted)" }}>
            <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Selecionar Tags</h4>
            <div className="flex gap-2">
              <button 
                onClick={handleSave} 
                className="text-xs px-2 py-1 rounded-md font-medium"
                style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}
                disabled={isPending}
              >
                {isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>

          {allTags.length === 0 && (
            <div className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
              Carregando tags...
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Group tags by category */}
            {Array.from(new Set(allTags.map(t => t.category))).map(cat => {
              const catTags = allTags.filter(t => t.category === cat);
              return (
                <div key={cat}>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                    {cat}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {catTags.map(tag => {
                      const isSelected = selectedIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleSelection(tag.id)}
                          className="text-xs px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors"
                          style={{
                            background: isSelected ? (tag.color ? `${tag.color}22` : "var(--accent-subtle)") : "var(--bg-input)",
                            border: `1px solid ${isSelected ? (tag.color ?? "var(--accent)") : "var(--border-muted)"}`,
                            color: isSelected ? (tag.color ?? "var(--accent-text)") : "var(--text-secondary)",
                            cursor: "pointer"
                          }}
                        >
                          {tag.icon && <span>{tag.icon}</span>}
                          {tag.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
