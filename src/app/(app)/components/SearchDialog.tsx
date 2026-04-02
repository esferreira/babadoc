"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchFullText } from "@/actions/artifact";

const ARTIFACT_TYPE_ICONS: Record<string, string> = {
  dataset: "📊", notebook: "📓", pipeline: "🔄", dashboard: "📈", process: "⚙️", troubleshooting: "🔧",
  rule: "📏", decision: "🎯", concept: "💡", glossary: "📖", system: "🖥️",
};

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const doSearch = useCallback(
    (q: string) => {
      if (q.length < 2) { setResults(null); return; }
      startTransition(async () => {
        const data = await searchFullText(q);
        setResults(data);
      });
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  function navigate(id: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(`/artifacts/${id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border-muted)",
          color: "var(--text-muted)",
          cursor: "pointer",
        }}
      >
        🔍 Buscar...
        <kbd
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1px 5px",
            fontSize: 10,
            fontFamily: "monospace",
            color: "var(--text-muted)",
          }}
        >
          Ctrl+K
        </kbd>
      </button>
    );
  }

  const totalResults = results
    ? (results.artifacts?.length ?? 0) + (results.facets?.length ?? 0)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Dialog */}
      <div
        className="animate-fade-in"
        style={{
          position: "fixed",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(560px, 90vw)",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 16px 64px rgba(0,0,0,0.6), 0 0 80px rgba(212,160,23,0.06)",
          zIndex: 101,
          overflow: "hidden",
        }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid var(--border-muted)" }}>
          <span style={{ fontSize: 16, color: "var(--accent-text)" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar artifacts, respostas, conteúdo..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 15,
            }}
          />
          {isPending && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>⏳</span>}
          <kbd
            onClick={() => setOpen(false)}
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 10,
              fontFamily: "monospace",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", padding: "8px" }}>
          {query.length < 2 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
              Digite pelo menos 2 caracteres para buscar
            </div>
          ) : totalResults === 0 && !isPending ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
              Nenhum resultado para &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Artifacts */}
              {results?.artifacts?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", padding: "4px 8px" }}>
                    Artifacts ({results.artifacts.length})
                  </div>
                  {results.artifacts.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => navigate(a.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "8px 10px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        textAlign: "left",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-input)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>{ARTIFACT_TYPE_ICONS[a.artifactType] ?? "📄"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Facets (content matches) */}
              {results?.facets?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", padding: "4px 8px" }}>
                    Conteúdo ({results.facets.length})
                  </div>
                  {results.facets.map((f: any, i: number) => (
                    <button
                      key={`f-${i}`}
                      onClick={() => navigate(f.id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        width: "100%",
                        padding: "8px 10px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        textAlign: "left",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-input)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ marginTop: 2 }}>📝</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.subtitle}</div>
                        {f.snippet && (
                          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
                            {f.snippet}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
