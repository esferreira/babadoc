"use client";

import { useState, useRef } from "react";

/* ══════════════════════════════════════════════
   38 QUESTIONS — Discovery Roteiro v1.1
   ══════════════════════════════════════════════ */
const QUESTIONS = [
  // BLOCO 1: NEGÓCIO
  { order: 1,  block: "NEGÓCIO",  sub: "1.1 Contexto e Definição",             priority: "MUST", title: "O que é este produto de dados?",                   hint: "Definição em 1-2 frases. Qual problema de negócio resolve?" },
  { order: 2,  block: "NEGÓCIO",  sub: "1.1 Contexto e Definição",             priority: "MUST", title: "Quem usa este dado?",                               hint: "Quais áreas, gerências ou times? Existe consumidor externo?" },
  { order: 3,  block: "NEGÓCIO",  sub: "1.1 Contexto e Definição",             priority: "MUST", title: "Quem é o dono do produto?",                         hint: "Quem responde pelas regras de negócio? Contato para dúvidas e problemas técnicos?" },
  { order: 4,  block: "NEGÓCIO",  sub: "1.1 Contexto e Definição",             priority: "MUST", title: "De onde vêm os dados?",                             hint: "Explicação simplificada: sistema A → processamento → dashboard/relatório." },
  { order: 5,  block: "NEGÓCIO",  sub: "1.1 Contexto e Definição",             priority: "NICE", title: "Esse produto se relaciona com outros?",              hint: "Alimenta ou é alimentado por outros produtos? Compõem um indicador maior?" },
  { order: 6,  block: "NEGÓCIO",  sub: "1.1 Contexto e Definição",             priority: "NICE", title: "Quais são as informações mais importantes?",         hint: "Os 8-10 campos/métricas principais que o usuário consulta." },
  { order: 7,  block: "NEGÓCIO",  sub: "1.2 Regras de Negócio",                priority: "MUST", title: "Como os valores são calculados?",                    hint: "Walk-through com exemplo numérico real. Fórmula conceitual (sem código)." },
  { order: 8,  block: "NEGÓCIO",  sub: "1.2 Regras de Negócio",                priority: "MUST", title: "Existem registros excluídos ou filtrados?",          hint: "Critérios de exclusão (status, tipo, data de corte). Por que essas regras existem?" },
  { order: 9,  block: "NEGÓCIO",  sub: "1.2 Regras de Negócio",                priority: "NICE", title: "Existe congelamento ou snapshot?",                   hint: "Os dados 'travam' em algum momento? É automático ou manual?" },
  { order: 10, block: "NEGÓCIO",  sub: "1.2 Regras de Negócio",                priority: "MUST", title: "Existem exceções às regras?",                       hint: "Quem autoriza exceções? Existe processo formal? Exemplos de concessões." },
  { order: 11, block: "NEGÓCIO",  sub: "1.2 Regras de Negócio",                priority: "MUST", title: "Existem inputs manuais?",                           hint: "Listas em SharePoint, planilhas Excel, formulários? Quem gerencia?" },
  { order: 12, block: "NEGÓCIO",  sub: "1.3 Operação e Uso",                   priority: "MUST", title: "Quando os dados ficam disponíveis?",                 hint: "Frequência (diário, semanal, mensal). Horário de disponibilidade." },
  { order: 13, block: "NEGÓCIO",  sub: "1.3 Operação e Uso",                   priority: "NICE", title: "Onde os dados são consumidos?",                      hint: "Dashboards, relatórios, APIs? Links quando possível." },
  { order: 14, block: "NEGÓCIO",  sub: "1.3 Operação e Uso",                   priority: "MUST", title: "Quais problemas o usuário costuma ter?",             hint: "Problemas comuns + o que verificar antes de escalar. Checklist L1." },
  { order: 15, block: "NEGÓCIO",  sub: "1.3 Operação e Uso",                   priority: "NICE", title: "Existem termos ou siglas específicos?",              hint: "Glossário do domínio. Definições necessárias." },
  { order: 16, block: "NEGÓCIO",  sub: "1.3 Operação e Uso",                   priority: "NICE", title: "Houve mudanças recentes?",                           hint: "O que mudou nos últimos meses? Impacto para o usuário?" },

  // BLOCO 2: TÉCNICO
  { order: 17, block: "TÉCNICO",  sub: "2.1 Arquitetura e Dados",              priority: "MUST", title: "Onde está o código?",                                hint: "Repositório, branch principal, estrutura de pastas." },
  { order: 18, block: "TÉCNICO",  sub: "2.1 Arquitetura e Dados",              priority: "MUST", title: "Quais camadas o dado percorre?",                     hint: "Raw → History → Consume? Delta, Parquet, Synapse?" },
  { order: 19, block: "TÉCNICO",  sub: "2.1 Arquitetura e Dados",              priority: "MUST", title: "Pode mostrar os notebooks/scripts principais?",      hint: "Demo dos notebooks de transformação. Quais são críticos?" },
  { order: 20, block: "TÉCNICO",  sub: "2.1 Arquitetura e Dados",              priority: "NICE", title: "Quais são as tabelas finais e seus schemas?",        hint: "Colunas, tipos, PKs, particionamento, distribuição." },
  { order: 21, block: "TÉCNICO",  sub: "2.1 Arquitetura e Dados",              priority: "MUST", title: "De quais fontes/tabelas upstream depende?",           hint: "Cada fonte: servidor, tabela, frequência, chave de join." },
  { order: 22, block: "TÉCNICO",  sub: "2.1 Arquitetura e Dados",              priority: "MUST", title: "Como as regras de negócio estão implementadas?",      hint: "Código SQL/Python das regras. Edge cases. Bugs conhecidos." },
  { order: 23, block: "TÉCNICO",  sub: "2.1 Arquitetura e Dados",              priority: "NICE", title: "Quem consome as tabelas finais?",                    hint: "Power BI, APIs, Excel, outros pipelines?" },
  { order: 24, block: "TÉCNICO",  sub: "2.2 Orquestração e Infra",             priority: "MUST", title: "Qual é o pipeline/DAG/job?",                         hint: "Orquestrador (ADF, Airflow, Workflow). Nome, estrutura, dependências." },
  { order: 25, block: "TÉCNICO",  sub: "2.2 Orquestração e Infra",             priority: "MUST", title: "Quando executa e quanto tempo leva?",                hint: "Schedule (cron, evento). Duração média. SLA." },
  { order: 26, block: "TÉCNICO",  sub: "2.2 Orquestração e Infra",             priority: "NICE", title: "Existem alertas de falha?",                          hint: "Alertas configurados? Quem recebe? Qual canal?" },
  { order: 27, block: "TÉCNICO",  sub: "2.2 Orquestração e Infra",             priority: "NICE", title: "Quais recursos cloud são usados?",                   hint: "Cluster, SKU, custo estimado, permissões necessárias." },
  { order: 28, block: "TÉCNICO",  sub: "2.3 Contingência e Troubleshooting",   priority: "MUST", title: "Como reprocessar do zero?",                          hint: "Step-by-step completo. Quanto tempo? Risco de duplicação?" },
  { order: 29, block: "TÉCNICO",  sub: "2.3 Contingência e Troubleshooting",   priority: "NICE", title: "Como reprocessar parcialmente?",                     hint: "Reprocessar só um período, unidade ou partição? Como?" },
  { order: 30, block: "TÉCNICO",  sub: "2.3 Contingência e Troubleshooting",   priority: "NICE", title: "Como validar que os dados estão corretos?",          hint: "Queries de validação. Contagens esperadas." },
  { order: 31, block: "TÉCNICO",  sub: "2.3 Contingência e Troubleshooting",   priority: "NICE", title: "Como reverter um erro?",                             hint: "Rollback disponível? Delta Time Travel? Backup?" },
  { order: 32, block: "TÉCNICO",  sub: "2.3 Contingência e Troubleshooting",   priority: "MUST", title: "Quais problemas já aconteceram?",                    hint: "Incidentes históricos. Como foram resolvidos. Workarounds ativos." },
  { order: 33, block: "TÉCNICO",  sub: "2.3 Contingência e Troubleshooting",   priority: "NICE", title: "Quais dependências e permissões são necessárias?",   hint: "Libs, pacotes, Service Principals, roles." },

  // BLOCO 3: ENTREGA / POWER BI
  { order: 34, block: "ENTREGA",  sub: "3.1 Entrega / Power BI",              priority: "NICE", title: "Pode fazer um walk-through do dashboard?",           hint: "Todas as páginas, filtros mais usados, páginas ocultas/admin." },
  { order: 35, block: "ENTREGA",  sub: "3.1 Entrega / Power BI",              priority: "MUST", title: "Existem cálculos no Power BI (DAX)?",               hint: "Medidas DAX críticas ou tudo vem pronto da camada Gold?" },
  { order: 36, block: "ENTREGA",  sub: "3.1 Entrega / Power BI",              priority: "MUST", title: "Qual o tipo de conexão?",                            hint: "Import, DirectQuery, LiveConnection? Schedule de refresh?" },
  { order: 37, block: "ENTREGA",  sub: "3.1 Entrega / Power BI",              priority: "NICE", title: "Existe segurança de dados (RLS)?",                   hint: "Row-Level Security? Quem vê o quê? Como é gerenciado?" },
  { order: 38, block: "ENTREGA",  sub: "3.1 Entrega / Power BI",              priority: "NICE", title: "Quais são os IDs do workspace/report/dataset?",      hint: "IDs para monitoramento e automação." },
];

type ExportFormat = "markdown" | "html" | "plaintext";
type FilterMode = "all" | "must" | "nice";

function buildMarkdown(productName: string, filterMode: FilterMode): string {
  const filtered = filterMode === "all" ? QUESTIONS : QUESTIONS.filter(q => filterMode === "must" ? q.priority === "MUST" : q.priority === "NICE");
  const today = new Date().toLocaleDateString("pt-BR");
  const lines: string[] = [];
  lines.push(`# 📋 Roteiro de Documentação — ${productName || "[Nome do Produto]"}`);
  lines.push("");
  lines.push(`> **Gerado via Babadoc** em ${today}`);
  lines.push(`> Preencha as respostas abaixo e envie de volta para importação no Babadoc.`);
  lines.push("");
  lines.push(`**Produto:** ${productName || "_______________"}`);
  lines.push(`**Responsável pelo preenchimento:** _______________`);
  lines.push(`**Data de preenchimento:** _______________`);
  lines.push("");
  lines.push("---");
  lines.push("");

  let currentBlock = "";
  let currentSub = "";

  for (const q of filtered) {
    if (q.block !== currentBlock) {
      currentBlock = q.block;
      const blockEmoji = q.block === "NEGÓCIO" ? "📊" : q.block === "TÉCNICO" ? "🔧" : "📈";
      lines.push(`## ${blockEmoji} Bloco: ${q.block}`);
      lines.push("");
    }
    if (q.sub !== currentSub) {
      currentSub = q.sub;
      lines.push(`### ${q.sub}`);
      lines.push("");
    }
    const badge = q.priority === "MUST" ? "🔒 Inegociável" : "💡 Desejável";
    lines.push(`**${q.order}. ${q.title}** \`[${badge}]\``);
    lines.push(`> _${q.hint}_`);
    lines.push("");
    lines.push("**Resposta:**");
    lines.push("");
    lines.push("_[Escreva sua resposta aqui]_");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("");
  lines.push("## ✅ Checklist de Entrega");
  lines.push("");
  lines.push("- [ ] Todas as perguntas marcadas como 🔒 Inegociável foram respondidas");
  lines.push("- [ ] As respostas foram validadas pelo dono do produto");
  lines.push("- [ ] O documento foi enviado para importação no Babadoc");
  lines.push("");
  lines.push("---");
  lines.push(`*Template gerado pelo Babadoc — plataforma de documentação de data products*`);

  return lines.join("\n");
}

function buildHtmlTable(productName: string, filterMode: FilterMode): string {
  const filtered = filterMode === "all" ? QUESTIONS : QUESTIONS.filter(q => filterMode === "must" ? q.priority === "MUST" : q.priority === "NICE");
  const today = new Date().toLocaleDateString("pt-BR");
  const rows = filtered
    .map(
      (q) =>
        `<tr>
  <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold;">${q.order}</td>
  <td style="padding:8px;border:1px solid #ddd;"><strong>${q.title}</strong><br/><em style="color:#666;font-size:0.9em;">${q.hint}</em></td>
  <td style="padding:8px;border:1px solid #ddd;text-align:center;">${q.block}</td>
  <td style="padding:8px;border:1px solid #ddd;text-align:center;">${q.priority === "MUST" ? '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:0.85em;">🔒 Inegociável</span>' : '<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:4px;font-size:0.85em;">💡 Desejável</span>'}</td>
  <td style="padding:8px;border:1px solid #ddd;min-width:300px;"></td>
</tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Roteiro de Documentação — ${productName || "Produto"}</title></head>
<body style="font-family:Segoe UI,Roboto,sans-serif;padding:24px;max-width:1200px;margin:0 auto;">
<h1 style="color:#333;">📋 Roteiro de Documentação — ${productName || "[Nome do Produto]"}</h1>
<p style="color:#666;">Gerado via <strong>Babadoc</strong> em ${today}</p>
<table style="border-collapse:collapse;width:100%;">
<thead>
<tr style="background:#f8f9fa;">
  <th style="padding:10px;border:1px solid #ddd;width:50px;">#</th>
  <th style="padding:10px;border:1px solid #ddd;">Pergunta</th>
  <th style="padding:10px;border:1px solid #ddd;width:100px;">Bloco</th>
  <th style="padding:10px;border:1px solid #ddd;width:120px;">Prioridade</th>
  <th style="padding:10px;border:1px solid #ddd;">Resposta</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<br/>
<p style="color:#999;font-size:0.85em;">Template gerado pelo Babadoc — plataforma de documentação de data products</p>
</body>
</html>`;
}

function buildPlainText(productName: string, filterMode: FilterMode): string {
  const filtered = filterMode === "all" ? QUESTIONS : QUESTIONS.filter(q => filterMode === "must" ? q.priority === "MUST" : q.priority === "NICE");
  const today = new Date().toLocaleDateString("pt-BR");
  const lines: string[] = [];
  lines.push(`ROTEIRO DE DOCUMENTAÇÃO — ${(productName || "[Nome do Produto]").toUpperCase()}`);
  lines.push(`Gerado via Babadoc em ${today}`);
  lines.push("═".repeat(72));
  lines.push("");
  lines.push(`Produto: ${productName || "_______________"}`);
  lines.push(`Responsável: _______________`);
  lines.push(`Data: _______________`);
  lines.push("");

  let currentBlock = "";
  let currentSub = "";

  for (const q of filtered) {
    if (q.block !== currentBlock) {
      currentBlock = q.block;
      lines.push("═".repeat(72));
      lines.push(`  BLOCO: ${q.block}`);
      lines.push("═".repeat(72));
      lines.push("");
    }
    if (q.sub !== currentSub) {
      currentSub = q.sub;
      lines.push(`── ${q.sub} ${"─".repeat(Math.max(0, 60 - q.sub.length))}`);
      lines.push("");
    }
    const badge = q.priority === "MUST" ? "[INEGOCIÁVEL]" : "[DESEJÁVEL]";
    lines.push(`${q.order}. ${q.title} ${badge}`);
    lines.push(`   Dica: ${q.hint}`);
    lines.push("");
    lines.push("   Resposta:");
    lines.push("   ________________________________________");
    lines.push("   ________________________________________");
    lines.push("");
  }

  lines.push("═".repeat(72));
  lines.push("Template gerado pelo Babadoc");
  return lines.join("\n");
}

export default function TemplatePage() {
  const [productName, setProductName] = useState("");
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const mustCount = QUESTIONS.filter((q) => q.priority === "MUST").length;
  const niceCount = QUESTIONS.filter((q) => q.priority === "NICE").length;
  const filteredCount = filterMode === "all" ? QUESTIONS.length : filterMode === "must" ? mustCount : niceCount;

  function getContent(): string {
    switch (format) {
      case "markdown": return buildMarkdown(productName, filterMode);
      case "html":     return buildHtmlTable(productName, filterMode);
      case "plaintext":return buildPlainText(productName, filterMode);
    }
  }

  async function handleCopy() {
    try {
      const content = getContent();
      if (format === "html") {
        // Copy HTML as rich text + plain fallback
        const blob = new Blob([content], { type: "text/html" });
        const plainBlob = new Blob([content], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blob,
            "text/plain": plainBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = getContent();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleDownload() {
    const content = getContent();
    const ext = format === "markdown" ? "md" : format === "html" ? "html" : "txt";
    const mime = format === "html" ? "text/html" : "text/plain";
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roteiro_documentacao_${(productName || "produto").toLowerCase().replace(/\s+/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Group questions by block for the preview
  const blocks = [
    { key: "NEGÓCIO", emoji: "📊", color: "#3b82f6" },
    { key: "TÉCNICO", emoji: "🔧", color: "#f59e0b" },
    { key: "ENTREGA", emoji: "📈", color: "#22c55e" },
  ] as const;

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          📄 Gerador de Template
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Gere um modelo de documentação com as 38 perguntas do Roteiro Discovery para preencher offline no Word, Microsoft Loop, Confluence ou qualquer outra plataforma.
        </p>
      </div>

      {/* Info Banner */}
      <div
        className="rounded-xl p-5 mb-8 template-info-banner"
        style={{
          background: "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(212,160,23,0.02))",
          border: "1px solid rgba(212,160,23,0.2)",
        }}
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl template-info-icon">💡</span>
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--accent-text)" }}>
              Como funciona?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Este gerador cria um template com todas as perguntas do roteiro de documentação.
              Você pode copiar diretamente para a área de transferência ou baixar como arquivo.
              Depois de preenchido, as respostas podem ser importadas no Babadoc para popular o banco de dados automaticamente.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="template-platform-badge">
                <span>📝</span> Microsoft Word
              </span>
              <span className="template-platform-badge">
                <span>🔄</span> Microsoft Loop
              </span>
              <span className="template-platform-badge">
                <span>📘</span> Confluence
              </span>
              <span className="template-platform-badge">
                <span>📋</span> Google Docs
              </span>
              <span className="template-platform-badge">
                <span>📌</span> Notion
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="baba-card p-4 text-center template-stat-card">
          <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
            {QUESTIONS.length}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Total de Perguntas</div>
        </div>
        <div className="baba-card p-4 text-center template-stat-card">
          <div className="text-2xl font-bold" style={{ color: "#ef4444" }}>
            {mustCount}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>🔒 Inegociáveis (MVP)</div>
        </div>
        <div className="baba-card p-4 text-center template-stat-card">
          <div className="text-2xl font-bold" style={{ color: "#3b82f6" }}>
            {niceCount}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>💡 Desejáveis</div>
        </div>
      </div>

      {/* Config Section */}
      <div className="baba-card p-6 mb-8 template-config-section">
        <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          ⚙️ Configuração do Template
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Product name */}
          <div>
            <label className="baba-label">Nome do Produto</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Pipeline Vendas, Dashboard KPI, ETL Produção..."
              className="baba-input"
            />
          </div>

          {/* Format */}
          <div>
            <label className="baba-label">Formato de Exportação</label>
            <div className="flex gap-2">
              {(
                [
                  { value: "markdown", label: "📝 Markdown", desc: "Loop / Confluence" },
                  { value: "html", label: "🌐 HTML Tabela", desc: "Word / Email" },
                  { value: "plaintext", label: "📄 Texto Puro", desc: "Qualquer lugar" },
                ] as const
              ).map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`template-format-btn ${format === f.value ? "active" : ""}`}
                >
                  <span className="text-base">{f.label.split(" ")[0]}</span>
                  <span className="text-xs font-medium">{f.label.split(" ").slice(1).join(" ")}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div>
            <label className="baba-label">Escopo das Perguntas</label>
            <div className="flex gap-2">
              {(
                [
                  { value: "all", label: `Todas (${QUESTIONS.length})` },
                  { value: "must", label: `MVP (${mustCount})` },
                  { value: "nice", label: `Desejáveis (${niceCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterMode(f.value)}
                  className={`template-scope-btn ${filterMode === f.value ? "active" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <button onClick={handleCopy} className="baba-button-primary template-action-btn" style={{ minWidth: 200 }}>
          {copied ? (
            <>
              <span>✅</span> Copiado!
            </>
          ) : (
            <>
              <span>📋</span> Copiar para Área de Transferência
            </>
          )}
        </button>
        <button onClick={handleDownload} className="baba-button-secondary template-action-btn">
          <span>⬇️</span> Baixar Arquivo
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            (.{format === "markdown" ? "md" : format === "html" ? "html" : "txt"})
          </span>
        </button>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="baba-button-secondary template-action-btn"
        >
          <span>{showPreview ? "🔼" : "🔽"}</span> {showPreview ? "Esconder" : "Visualizar"} Preview
        </button>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="baba-card mb-8 template-preview-panel animate-fade-in" ref={previewRef}>
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border-muted)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">👁️</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Preview — {filteredCount} perguntas em formato{" "}
                {format === "markdown" ? "Markdown" : format === "html" ? "HTML Tabela" : "Texto Puro"}
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Scroll para ver tudo
            </span>
          </div>
          <div className="p-5" style={{ maxHeight: 500, overflowY: "auto" }}>
            {format === "html" ? (
              <div dangerouslySetInnerHTML={{ __html: getContent() }} />
            ) : (
              <pre
                className="text-xs"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-geist-mono), monospace",
                  lineHeight: 1.6,
                }}
              >
                {getContent()}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Questions Visual List */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          📋 Perguntas incluídas no template ({filteredCount})
        </h2>
        <div className="flex flex-col gap-6">
          {blocks.map((block) => {
            const blockQuestions = (filterMode === "all"
              ? QUESTIONS
              : QUESTIONS.filter((q) =>
                  filterMode === "must" ? q.priority === "MUST" : q.priority === "NICE"
                )
            ).filter((q) => q.block === block.key);

            if (blockQuestions.length === 0) return null;

            // Group by subcategory
            const subs = [...new Set(blockQuestions.map((q) => q.sub))];

            return (
              <div key={block.key} className="template-block-section">
                <div
                  className="flex items-center gap-2 mb-3 px-1"
                >
                  <span className="text-lg">{block.emoji}</span>
                  <span className="text-sm font-bold" style={{ color: block.color }}>
                    Bloco: {block.key}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ({blockQuestions.length} perguntas)
                  </span>
                </div>
                {subs.map((sub) => {
                  const subQuestions = blockQuestions.filter((q) => q.sub === sub);
                  return (
                    <div key={sub} className="mb-4">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: "var(--text-muted)" }}>
                        {sub}
                      </div>
                      <div className="flex flex-col gap-1">
                        {subQuestions.map((q) => (
                          <div key={q.order} className="template-question-row">
                            <div className="flex items-center gap-3 flex-1">
                              <span
                                className="template-question-number"
                                style={{
                                  background: q.priority === "MUST" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                                  color: q.priority === "MUST" ? "#ef4444" : "#3b82f6",
                                }}
                              >
                                {q.order}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                  {q.title}
                                </div>
                                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                  {q.hint}
                                </div>
                              </div>
                            </div>
                            <span
                              className="template-priority-badge"
                              style={{
                                background: q.priority === "MUST" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
                                color: q.priority === "MUST" ? "#fca5a5" : "#93c5fd",
                              }}
                            >
                              {q.priority === "MUST" ? "🔒 MVP" : "💡 NICE"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer tip */}
      <div
        className="rounded-xl p-5 text-center mb-8"
        style={{ background: "var(--bg-input)", border: "1px solid var(--border-muted)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          💡 Após o preenchimento do template, envie o documento para que as respostas sejam importadas no{" "}
          <strong style={{ color: "var(--accent-text)" }}>Babadoc</strong> e populem o banco de dados automaticamente.
        </p>
      </div>
    </main>
  );
}
