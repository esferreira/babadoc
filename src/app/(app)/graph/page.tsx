import { getRelationshipGraph } from "@/actions/graph";
import { GraphView } from "./GraphView";
import { AddRelationForm } from "./AddRelationForm";

export const metadata = { title: "Grafo de Dependências — Babadoc" };

export default async function GraphPage() {
  const data = await getRelationshipGraph();

  return (
    <main className="flex-1 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            🕸️ Grafo de Dependências
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Visualize e gerencie as relações entre artifacts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{data.nodes.length} artifacts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "var(--success)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{data.edges.length} relações</span>
          </div>
        </div>
      </div>

      {/* Add Relation Form */}
      <AddRelationForm nodes={data.nodes} />

      <GraphView nodes={data.nodes} edges={data.edges} />
    </main>
  );
}
