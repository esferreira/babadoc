"use client";

import { useState, useRef } from "react";

type ImportStats = {
  organizations: number;
  areas: number;
  artifacts: number;
  facets: number;
  tags: number;
  relationships: number;
  images: number;
  comments: number;
  skipped: number;
};

type ImportResult = {
  success: boolean;
  message: string;
  stats: ImportStats;
  source: {
    exportedAt: string;
    exportedBy: string;
    originalStats: Record<string, number>;
  };
};

export default function PortabilityPage() {
  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ═══════════════════════════════════════
  // EXPORT HANDLER
  // ═══════════════════════════════════════
  async function handleExport() {
    setExporting(true);
    setExportError(null);
    setExportDone(false);

    try {
      const res = await fetch("/api/export");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao exportar");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] ?? `babadoc_export_${new Date().toISOString().split("T")[0]}.babadoc`;

      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } catch (err) {
      setExportError((err as Error).message);
    } finally {
      setExporting(false);
    }
  }

  // ═══════════════════════════════════════
  // IMPORT HANDLERS
  // ═══════════════════════════════════════
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleImport() {
    if (!selectedFile) return;

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao importar");
      }

      setImportResult(data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          🔄 Portabilidade
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Exporte e importe toda a base de conhecimento do Babadoc entre diferentes instâncias e computadores.
        </p>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl p-5 mb-8"
        style={{
          background: "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(212,160,23,0.02))",
          border: "1px solid rgba(212,160,23,0.2)",
        }}
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl template-info-icon">📦</span>
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--accent-text)" }}>
              Formato .babadoc
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              O arquivo <code style={{ color: "var(--accent-text)", background: "var(--bg-input)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>.babadoc</code> é
              um pacote ZIP contendo um manifesto JSON com todos os dados (artifacts, respostas, tags,
              relacionamentos) e as imagens referenciadas na documentação. Pode ser transferido por
              email, pen drive, OneDrive ou qualquer outro meio.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="text-sm">📊</span> Artifacts & Respostas
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="text-sm">🏷️</span> Tags & Categorias
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="text-sm">🕸️</span> Relacionamentos
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="text-sm">🖼️</span> Imagens embedadas
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="text-sm">💬</span> Comentários
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ═══════════ EXPORT CARD ═══════════ */}
        <div className="portability-card">
          <div className="portability-card-header" style={{ borderBottom: "1px solid var(--border-muted)" }}>
            <div className="flex items-center gap-3">
              <div className="portability-icon-circle" style={{ background: "rgba(34,197,94,0.15)" }}>
                <span className="text-xl">📤</span>
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Exportar</h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Gerar arquivo .babadoc</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Empacota <strong style={{ color: "var(--text-primary)" }}>todos os dados</strong> da instância
              atual em um arquivo único. Inclui automaticamente todas as imagens usadas na documentação.
            </p>

            <div className="portability-checklist">
              {[
                "Artifacts com todas as respostas",
                "Organizações, áreas e tags",
                "Grafo de relacionamentos",
                "Imagens embedadas nos conteúdos",
                "Comentários e agendas de revisão",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  {item}
                </div>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="baba-button-primary w-full justify-center mt-5"
              style={{ padding: "12px 16px" }}
            >
              {exporting ? (
                <>
                  <span className="portability-spinner">⏳</span> Empacotando dados e imagens...
                </>
              ) : exportDone ? (
                <>
                  <span>✅</span> Download iniciado!
                </>
              ) : (
                <>
                  <span>📤</span> Exportar Tudo
                </>
              )}
            </button>

            {exportError && (
              <div className="portability-error mt-3">
                <span>❌</span> {exportError}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ IMPORT CARD ═══════════ */}
        <div className="portability-card">
          <div className="portability-card-header" style={{ borderBottom: "1px solid var(--border-muted)" }}>
            <div className="flex items-center gap-3">
              <div className="portability-icon-circle" style={{ background: "rgba(59,130,246,0.15)" }}>
                <span className="text-xl">📥</span>
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Importar</h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Carregar arquivo .babadoc</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Carrega dados de outra instância. Artifacts existentes são atualizados pelo{" "}
              <strong style={{ color: "var(--text-primary)" }}>nome canônico</strong>. Dados novos são adicionados.
              Apenas <strong style={{ color: "var(--accent-text)" }}>administradores</strong> podem importar.
            </p>

            {/* Drop zone */}
            <div
              className={`portability-dropzone ${dragActive ? "active" : ""} ${selectedFile ? "has-file" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".babadoc,.zip"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📦</span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {selectedFile.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatFileSize(selectedFile.size)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs mt-1"
                    style={{ color: "var(--danger)" }}
                  >
                    × Remover
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl" style={{ opacity: 0.5 }}>📁</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Arraste um arquivo <code style={{ color: "var(--accent-text)", fontSize: 12 }}>.babadoc</code> aqui
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ou clique para selecionar
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="baba-button-primary w-full justify-center mt-4"
              style={{
                padding: "12px 16px",
                background: selectedFile
                  ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                  : undefined,
                opacity: selectedFile ? 1 : 0.4,
              }}
            >
              {importing ? (
                <>
                  <span className="portability-spinner">⏳</span> Importando dados...
                </>
              ) : (
                <>
                  <span>📥</span> Importar Dados
                </>
              )}
            </button>

            {importError && (
              <div className="portability-error mt-3">
                <span>❌</span> {importError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ IMPORT RESULTS ═══════════ */}
      {importResult && (
        <div className="portability-result animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--success)" }}>
                {importResult.message}
              </h3>
              {importResult.source?.exportedAt && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Pacote exportado por <strong>{importResult.source.exportedBy}</strong> em{" "}
                  {new Date(importResult.source.exportedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Artifacts", value: importResult.stats.artifacts, icon: "📊", color: "var(--accent)" },
              { label: "Respostas", value: importResult.stats.facets, icon: "💬", color: "var(--success)" },
              { label: "Tags", value: importResult.stats.tags, icon: "🏷️", color: "#3b82f6" },
              { label: "Relações", value: importResult.stats.relationships, icon: "🕸️", color: "#a855f7" },
              { label: "Imagens", value: importResult.stats.images, icon: "🖼️", color: "#f59e0b" },
              { label: "Comentários", value: importResult.stats.comments, icon: "💬", color: "#06b6d4" },
              { label: "Organizações", value: importResult.stats.organizations, icon: "🏢", color: "#ec4899" },
              { label: "Ignorados", value: importResult.stats.skipped, icon: "⏭️", color: "var(--text-muted)" },
            ].map((s) => (
              <div key={s.label} className="portability-stat-mini">
                <span className="text-lg">{s.icon}</span>
                <span className="text-lg font-bold" style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="portability-card mb-8">
        <div className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            📖 Como funciona a portabilidade?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Exportar",
                desc: "No computador de origem, clique em Exportar. O sistema empacota todos os artifacts, respostas e imagens em um arquivo .babadoc.",
                icon: "📤",
              },
              {
                step: "2",
                title: "Transferir",
                desc: "Copie o arquivo .babadoc por pen drive, email, OneDrive, Teams ou qualquer outro meio entre computadores e redes.",
                icon: "💾",
              },
              {
                step: "3",
                title: "Importar",
                desc: "No computador de destino, faça upload do .babadoc. Dados novos são adicionados; existentes são atualizados sem perda.",
                icon: "📥",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}
                >
                  {s.step}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {s.icon} {s.title}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
