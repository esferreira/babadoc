// Labels em pt-BR para prioridades de perguntas
// Códigos internos (DB): MUST, NICE, NA, DEFAULT
// Exibição para o usuário: termos em português

export const PRIORITY_LABELS: Record<string, string> = {
  MUST: "Obrigatória",
  NICE: "Desejável",
  NA: "Não se aplica",
  DEFAULT: "Padrão",
};

export const PRIORITY_LABELS_SHORT: Record<string, string> = {
  MUST: "Obrig.",
  NICE: "Desej.",
  NA: "N/A",
};

export const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MUST: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "rgba(239,68,68,0.4)" },
  NICE: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.4)" },
  NA:   { bg: "rgba(107,114,128,0.15)", text: "#6b7280", border: "rgba(107,114,128,0.4)" },
};

export function priorityLabel(code: string): string {
  return PRIORITY_LABELS[code] ?? code;
}

// Labels para categorias de perguntas
export const CATEGORY_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  BUSINESS:  { label: "Negócio",  icon: "💼", desc: "Contexto, regras e operação para usuários de negócio" },
  TECHNICAL: { label: "Técnico",  icon: "⚙️", desc: "Arquitetura, pipelines e troubleshooting" },
  DELIVERY:  { label: "Entrega",  icon: "📊", desc: "Power BI, conexão e segurança" },
};

export const CATEGORY_COLORS: Record<string, string> = {
  BUSINESS:  "#3b82f6",
  TECHNICAL: "#f59e0b",
  DELIVERY:  "#10b981",
};

// Labels para tipos de artefato
export const ARTIFACT_TYPE_LABELS: Record<string, { icon: string; label: string; desc: string }> = {
  dataset: { icon: "📊", label: "Tabela / Dataset", desc: "Tabela materializada na Consume Zone (Parquet/Delta)" },
  notebook: { icon: "📓", label: "Notebook", desc: "Código PySpark/SQL de transformação" },
  pipeline: { icon: "🔄", label: "Pipeline", desc: "Fluxo ADF ou Databricks Workflow" },
  dashboard: { icon: "📈", label: "Dashboard", desc: "Relatório ou painel consumido pelo negócio" },
  process:         { icon: "⚙️", label: "Processo",        desc: "Fluxo de trabalho ou processo operacional" },
  troubleshooting: { icon: "🔧", label: "Troubleshooting", desc: "Guia de resolução de problemas" },
  rule:            { icon: "📏", label: "Regra",           desc: "Regra de negócio ou validação" },
  decision:        { icon: "🎯", label: "Decisão",         desc: "Registro de decisão arquitetural (ADR)" },
  concept:         { icon: "💡", label: "Conceito",        desc: "Definição ou conceito do domínio" },
  glossary:        { icon: "📖", label: "Glossário",       desc: "Termos e definições do negócio" },
  system:          { icon: "🖥️", label: "Sistema",         desc: "Sistema, plataforma ou ferramenta" },
};

// Labels para status de artefato
export const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft:      { label: "Rascunho",     cls: "baba-badge-draft" },
  published:  { label: "Publicado",    cls: "baba-badge-published" },
  deprecated: { label: "Descontinuado", cls: "baba-badge-deprecated" },
  archived:   { label: "Arquivado",    cls: "baba-badge-archived" },
};

// Labels para roles de usuário
export const ROLE_LABELS: Record<string, string> = {
  admin:  "Administrador",
  editor: "Editor",
  member: "Membro",
};
