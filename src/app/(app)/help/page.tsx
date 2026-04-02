import { auth } from "@/auth";
import { redirect } from "next/navigation";

const SECTIONS = [
  {
    icon: "📖",
    title: "O que é o Babadoc?",
    content:
      "O Babadoc é uma plataforma de documentação de data products que organiza o conhecimento em **Artifacts** — entidades documentáveis como pipelines, processos, regras de negócio e sistemas. Cada artifact possui um roteiro de perguntas que guiam a documentação completa.",
  },
  {
    icon: "📁",
    title: "O que são Artifacts?",
    content:
      "Artifacts são as unidades de documentação. Cada artifact tem um **nome canônico** (identificador único), um **tipo** (Data Product, Processo, Troubleshooting, etc.), e pertence a uma **área** dentro da organização. A documentação é feita respondendo perguntas organizadas em categorias: Negócio, Técnico e Entrega.",
  },
  {
    icon: "📝",
    title: "Como responder perguntas?",
    content:
      "Abra um artifact, clique em uma pergunta e use o editor rich text para inserir sua resposta com formatação, imagens, links e código. Ao salvar, sua resposta fica registrada com versionamento automático.",
  },
  {
    icon: "💬",
    title: "O que são Complementos?",
    content:
      'Se uma pergunta já foi respondida por outra pessoa, membros podem adicionar **complementos** que aparecem junto com a resposta principal, sem substituí-la. Para propor uma **substituição**, use o botão "Propor Substituição" — a nova resposta passará por aprovação de um editor ou admin.',
  },
  {
    icon: "⏳",
    title: "Como funciona a Aprovação?",
    content:
      "Quando um membro propõe substituir uma resposta existente, ela fica com status **Aguardando Aprovação**. Editores e administradores veem essas pendências diretamente na pergunta, com botões para **Aprovar** (substitui a anterior) ou **Rejeitar** (descarta a proposta).",
  },
  {
    icon: "📜",
    title: "Histórico de Respostas",
    content:
      'Cada pergunta tem um botão **Histórico** que mostra todas as versões das respostas ao longo do tempo, com status coloridos: 🟢 Atual, 🔵 Complemento, 🟡 Pendente, ⬜ Arquivada, 🔴 Rejeitada.',
  },
  {
    icon: "🔒",
    title: "Permissões e Papéis",
    content:
      "O sistema tem três papéis: **Admin** (acesso total, gerencia usuários e configurações), **Editor** (pode editar qualquer resposta e aprovar substituições) e **Membro** (pode responder perguntas novas, adicionar complementos e propor substituições, mas não editar respostas de outros).",
  },
  {
    icon: "📊",
    title: "Score de Documentação",
    content:
      "Cada artifact tem um score que indica o percentual de perguntas respondidas. Perguntas marcadas como N/A para o tipo do artifact não contam. O objetivo é atingir 100% de cobertura nas perguntas aplicáveis.",
  },
  {
    icon: "🏷️",
    title: "Status dos Artifacts",
    content:
      'Artifacts começam como **Rascunho** e podem ser promovidos para **Publicado** (documentação completa), **Depreciado** (desatualizado) ou **Arquivado** (fora de uso). Apenas editores e admins podem alterar o status.',
  },
];

export default async function HelpPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex-1 px-8 py-8 overflow-y-auto" style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          ❓ Central de Ajuda
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Tudo que você precisa saber para usar o Babadoc de forma eficiente.
        </p>
      </div>

      {/* Quick nav */}
      <div
        className="rounded-xl p-4 mb-8"
        style={{ background: "var(--accent-subtle)", border: "1px solid rgba(212,160,23,0.2)" }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-text)" }}>
          Navegação Rápida
        </h3>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.title}
              href={`#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-muted)" }}
            >
              {s.icon} {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
            className="rounded-xl p-5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{section.icon}</span>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {section.title}
              </h2>
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{
                __html: section.content
                  .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>'),
              }}
            />
          </div>
        ))}
      </div>

      {/* Keyboard shortcuts */}
      <div className="mt-8 mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--accent-text)" }}>
          ⌨️ Atalhos do Editor
        </h2>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border-muted)" }}
        >
          <table className="baba-table">
            <thead>
              <tr>
                <th>Atalho</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Ctrl + B", "Negrito"],
                ["Ctrl + I", "Itálico"],
                ["Ctrl + U", "Sublinhado"],
                ["Ctrl + Z", "Desfazer"],
                ["Ctrl + Y", "Refazer"],
                ["Ctrl + V", "Colar (suporta imagens)"],
              ].map(([key, action]) => (
                <tr key={key}>
                  <td>
                    <code
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-muted)",
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: "var(--accent-text)",
                      }}
                    >
                      {key}
                    </code>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact */}
      <div
        className="rounded-xl p-5 text-center"
        style={{ background: "var(--bg-input)", border: "1px solid var(--border-muted)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ainda tem dúvidas? Entre em contato com o{" "}
          <strong style={{ color: "var(--accent-text)" }}>administrador do sistema</strong>.
        </p>
      </div>
    </main>
  );
}
