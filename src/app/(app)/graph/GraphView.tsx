"use client";

import { useRef, useState, useEffect, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { deleteRelationship } from "@/actions/graph";
import { useRouter } from "next/navigation";

// Dynamic import with SSR disabled to ensure Canvas renders correctly
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col justify-center items-center h-[500px] w-full text-sm" style={{ color: "var(--text-muted)" }}>
      <span className="animate-spin text-2xl mb-2">⚙️</span>
      Renderizando Motor de Física...
    </div>
  )
});

const TYPE_COLORS: Record<string, string> = {
  dataset: "#10B981", notebook: "#F59E0B", pipeline: "#3B82F6", dashboard: "#F2C811", process: "#3b82f6", troubleshooting: "#f59e0b",
  rule: "#10b981", decision: "#ec4899", concept: "#8b5cf6",
  glossary: "#06b6d4", system: "#78716c",
};

const REL_COLORS: Record<string, string> = {
  feeds_into: "#22c55e", derived_from: "#3b82f6", depends_on: "#f59e0b",
  implements: "#8b5cf6", related_to: "#71717a", consumed_by: "#ec4899",
};

const REL_LABELS: Record<string, string> = {
  feeds_into: "alimenta", derived_from: "derivado de", depends_on: "depende de",
  implements: "implementa", related_to: "relacionado", consumed_by: "consumido por",
};

interface Node { id: string; displayName: string; canonicalName: string; artifactType: string; status: string; }
interface Edge { id: string; sourceArtifactId: string; targetArtifactId: string; relationshipType: string; description: string | null; }

export function GraphView({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ w: 900, h: 650 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const fgRef = useRef<any>();

  function handleDeleteRel(id: string) {
    if (!confirm("Tem certeza que deseja isolar este nó desligando essa relação?")) return;
    startTransition(async () => {
      await deleteRelationship(id);
      router.refresh();
    });
  }

  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setDimensions({ w: width, h: 650 });
    }
    
    // Resize observer to keep the internal canvas responsive
    const observer = new ResizeObserver((entries) => {
        if(entries[0]) {
            setDimensions((prev) => ({ ...prev, w: entries[0].contentRect.width }));
        }
    });
    if(containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const searchRegex = useMemo(() => {
    if (!searchTerm) return null;
    try {
      return new RegExp(searchTerm.trim(), "i");
    } catch {
      return null;
    }
  }, [searchTerm]);

  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(n => ({ ...n, name: n.displayName, val: 5 })),
      links: edges.map(e => ({
        ...e,
        source: e.sourceArtifactId,
        target: e.targetArtifactId,
        name: REL_LABELS[e.relationshipType] || e.relationshipType,
        color: REL_COLORS[e.relationshipType] || "#71717a"
      })),
    };
  }, [nodes, edges]);

  // Determine connected nodes for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode && !hoverNode) return null;
    const focus = hoverNode || selectedNode;
    const connectedEdges = edges.filter(e => e.sourceArtifactId === focus || e.targetArtifactId === focus);
    return new Set([focus, ...connectedEdges.map(e => e.sourceArtifactId), ...connectedEdges.map(e => e.targetArtifactId)]);
  }, [selectedNode, hoverNode, edges]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const color = TYPE_COLORS[node.artifactType] ?? "#71717a";
      const isFocused = connectedNodeIds ? connectedNodeIds.has(node.id) : true;
      const isSelected = selectedNode === node.id;
      const isHovered = hoverNode === node.id;
      let isSearched = false;
      if (searchRegex) {
          isSearched = searchRegex.test(node.displayName) || searchRegex.test(node.canonicalName);
      }

      // If the user typed a search but this node is not part of the search, fade it severely
      const alpha = isFocused && (!searchRegex || isSearched) ? 1 : (searchRegex ? 0.05 : 0.15);
      
      const baseR = 5;
      const r = isSelected || isHovered || isSearched ? baseR * 1.5 : baseR;

      // Glow effect for searched nodes
      if (isSearched && !isSelected && !isHovered) {
         ctx.beginPath();
         ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
         ctx.fillStyle = `rgba(234, 179, 8, 0.4)`; // Yellow shadow
         ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      
      // Node Border
      if (isSelected || isSearched) {
          ctx.lineWidth = 1.5 / globalScale;
          ctx.strokeStyle = isSearched ? "#eab308" : (document.documentElement.getAttribute('data-theme') === 'dark' ? "#fff" : "#000");
          ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Label Logic
      const showFullText = isHovered || isSelected || isSearched || globalScale > 1.8;
      const fontSize = showFullText ? 14 / globalScale : 11 / globalScale;
      
      if (globalScale > 0.6 || showFullText) {
          ctx.font = `600 ${fontSize}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          
          let title = node.displayName;
          if (!showFullText && title.length > 20) {
              title = title.substring(0, 18) + "...";
          }
          
          // Background bounding box for text to ensure crisp legibility over lines
          const textWidth = ctx.measureText(title).width;
          const bgHeight = fontSize * 1.4;
          ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? `rgba(20,20,20,${alpha})` : `rgba(255,255,255,${alpha})`;
          ctx.fillRect(node.x - textWidth/2 - 2, node.y + r + 2, textWidth + 4, bgHeight);
          
          ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
          ctx.fillText(title, node.x, node.y + r + 4);
      }
  }, [connectedNodeIds, selectedNode, hoverNode, searchRegex]);


  return (
    <div>
      {/* Top Bar Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(REL_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 cursor-help" title={`Relação do tipo ${key}`}>
                <span className="w-3 h-0.5 rounded-full" style={{ background: REL_COLORS[key], display: "inline-block" }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="w-full xl:w-80 relative flex items-center">
             <span className="absolute left-3 text-sm opacity-50">🔍</span>
             <input 
                type="text" 
                placeholder="Buscar nó por nomenclatura técnica ou nome..." 
                className="baba-input text-xs w-full py-2.5 pl-9 bg-[var(--bg-secondary)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                 <button className="absolute right-3 text-xs opacity-50 hover:opacity-100" onClick={() => setSearchTerm("")}>✖</button>
             )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SVG/Canvas Viewport */}
        <div 
            ref={containerRef} 
            className="baba-card overflow-hidden relative lg:col-span-3 border" 
            style={{ height: dimensions.h, borderColor: "var(--border-color)" }}
        >
            
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-[var(--bg-primary)] border shadow-sm select-none" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }}>
                    <span className="opacity-50 mr-1">Roda</span> Zoom / Scale
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-[var(--bg-primary)] border shadow-sm select-none" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }}>
                    <span className="opacity-50 mr-1">Clique + Arraste</span> Move Nó / Map
                </span>
            </div>

            {nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-5xl mb-4">🕸️</span>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Nenhum artifact cadastrado.
                    </p>
                </div>
            ) : (
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.w}
                    height={dimensions.h}
                    graphData={graphData}
                    nodeLabel="" // Custom label implementation via nodeCanvasObject
                    nodeRelSize={6}
                    nodeCanvasObject={paintNode}
                    nodeCanvasObjectMode={() => 'replace'}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    linkColor={(link: any) => link.color}
                    linkWidth={(link: any) => (connectedNodeIds && (connectedNodeIds.has(link.source.id) && connectedNodeIds.has(link.target.id)) ? 2 : 1)}
                    linkOpacity={(link: any) => (connectedNodeIds && (!connectedNodeIds.has(link.source.id) || !connectedNodeIds.has(link.target.id)) ? 0.05 : 0.6)}
                    linkDirectionalParticles={(link: any) => (connectedNodeIds && connectedNodeIds.has(link.source.id) && connectedNodeIds.has(link.target.id) ? 2 : 0)}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleWidth={1.5}
                    onNodeClick={(node: any) => {
                        setSelectedNode(prev => prev === node.id ? null : node.id);
                        if (fgRef.current) {
                            fgRef.current.centerAt(node.x, node.y, 800);
                            fgRef.current.zoom(2, 800);
                        }
                    }}
                    onNodeHover={(node: any) => {
                        setHoverNode(node ? node.id : null);
                        if (containerRef.current) {
                            containerRef.current.style.cursor = node ? 'pointer' : 'grab';
                        }
                    }}
                    onBackgroundClick={() => setSelectedNode(null)}
                    cooldownTicks={100}
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                />
            )}
        </div>

        {/* Selected node detail sidebar */}
        <div className="lg:col-span-1 h-full">
            {selectedNode ? (() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;
                const nodeEdges = edges.filter(e => e.sourceArtifactId === selectedNode || e.targetArtifactId === selectedNode);
                
                return (
                <div className="baba-card p-5 animate-fade-in flex flex-col border-t-4" style={{ borderColor: TYPE_COLORS[node.artifactType] ?? "var(--accent)", height: dimensions.h }}>
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ background: `${TYPE_COLORS[node.artifactType]}22`, color: TYPE_COLORS[node.artifactType] }}>
                            {node.artifactType}
                        </span>
                        {/* Status badge */}
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded opacity-60 bg-black/5 dark:bg-white/5" style={{ color: "var(--text-muted)" }}>
                            {node.status}
                        </span>
                    </div>
                    
                    <h3 className="text-base font-bold mb-2 leading-snug" style={{ color: "var(--text-primary)" }}>{node.displayName}</h3>
                    <p className="text-[11px] font-mono break-all mb-4" style={{ color: "var(--text-muted)", userSelect: "all" }}>
                        {node.canonicalName}
                    </p>
                    
                    <Link href={`/artifacts/${node.id}`} className="baba-button w-full text-center text-sm py-2 mb-6 shadow-sm">
                        Abrir Documentação (Wiki)
                    </Link>

                    <h4 className="text-[10px] font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Mapa de Conexões Diretas ({nodeEdges.length})</h4>
                    
                    {nodeEdges.length > 0 ? (
                    <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4 flex-1">
                        {nodeEdges.map(e => {
                        const isSource = e.sourceArtifactId === selectedNode;
                        const otherId = isSource ? e.targetArtifactId : e.sourceArtifactId;
                        const other = nodes.find(n => n.id === otherId);
                        return (
                            <div key={e.id} className="p-2.5 rounded flex flex-col gap-1.5 transition-colors bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-color)]">
                            <div className="flex items-start justify-between">
                                <span className="text-[9px] font-bold uppercase mt-0.5" style={{ color: REL_COLORS[e.relationshipType] ?? "var(--text-muted)" }}>
                                {isSource ? "↘ Alimenta / " : "↖ Consome / "} {REL_LABELS[e.relationshipType] ?? e.relationshipType}
                                </span>
                                <button 
                                onClick={() => handleDeleteRel(e.id)} 
                                disabled={isPending}
                                className="text-xs px-1.5 py-0.5 rounded transition-opacity hover:bg-red-500/10 text-red-500 opacity-30 hover:opacity-100"
                                title="Desfazer relação permanente"
                                >
                                ✖
                                </button>
                            </div>
                            <span 
                                className="text-xs font-semibold leading-tight cursor-pointer hover:underline decoration-dashed" 
                                onClick={() => {
                                    setSelectedNode(otherId);
                                    if(fgRef.current && other) {
                                        // A simple search via finding x,y requires accessing graphData nodes which we know because `otherId`
                                        // But we center lazily. It will re-render anyway.
                                    }
                                }} 
                                style={{ color: "var(--text-primary)" }}
                            >
                                {other?.displayName ?? otherId}
                            </span>
                            </div>
                        );
                        })}
                    </div>
                    ) : (
                    <p className="text-xs text-center p-4 bg-[var(--bg-secondary)] rounded flex-1 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>Nó Isolado na Rede.</p>
                    )}
                </div>
                );
            })() : (
                <div className="baba-card p-6 h-full flex flex-col items-center justify-center text-center opacity-60 border-dashed" style={{ borderColor: "var(--border-color)", borderStyle: "dashed", borderWidth: "2px" }}>
                    <span className="text-4xl mb-4">🖱️</span>
                    <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Nó não selecionado</h4>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Selecione qualquer Artifact interagindo com a visualização espacial do Grafo para Inspecioná-lo.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
