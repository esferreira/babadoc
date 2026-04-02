import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AboutPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex-1 px-8 py-8 overflow-y-auto" style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #d4a017, #b8860b)",
              boxShadow: "0 4px 24px rgba(212,160,23,0.3)",
            }}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3a3 3 0 106 0 3 3 0 00-6 0z"
                fill="#0a0a0a"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Baba<span style={{ color: "#d4a017" }}>doc</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              O Guia do Conhecimento · v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--accent-text)" }}>
          O que significa Babadoc?
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
          Dentro do contexto que exploramos sobre o termo <strong style={{ color: "var(--text-primary)" }}>&quot;Baba&quot;</strong>, 
          o nome <strong style={{ color: "var(--accent-text)" }}>Babadoc</strong> para um sistema de documentação ganha 
          conotações poderosas e intencionais:
        </p>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          {/* Card 1 */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🧘</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                A &quot;Fonte da Verdade&quot; — O Guru da Documentação
              </h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Como <em>&quot;Baba&quot;</em> refere-se a um sábio ou mestre espiritual, <strong style={{ color: "var(--accent-text)" }}>Babadoc</strong> sugere 
              que o sistema é o <strong style={{ color: "var(--text-primary)" }}>detentor do conhecimento supremo</strong> do projeto. 
              Assim como as pessoas buscam um Baba para obter orientação e clareza, os desenvolvedores e analistas buscam 
              o Babadoc para encontrar a &quot;verdade&quot; sobre os dados, processos e regras de negócio.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏛️</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                O &quot;Pai da Documentação&quot; — Autoridade e Governança
              </h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Pelo significado de &quot;pai&quot; ou &quot;patriarca&quot;, o nome transmite <strong style={{ color: "var(--text-primary)" }}>proteção e hierarquia</strong>. 
              É a documentação que coloca ordem na casa, servindo como estrutura central que sustenta o conhecimento técnico — 
              como um ancião respeitado que sabe onde cada peça se encaixa.
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🤝</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Simplicidade e Acolhimento — User-Friendly
              </h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Se usarmos a acepção de &quot;Baba&quot; como um termo carinhoso e familiar, o nome sugere que a documentação é 
              <strong style={{ color: "var(--text-primary)" }}> fácil de entender e acessível</strong>. Um Babadoc é o oposto de 
              documentação densa e burocrática — feito para que qualquer pessoa, do estagiário ao sênior, consiga 
              consumir informação sem dor de cabeça.
            </p>
          </div>
        </div>
      </section>

      {/* Why it works */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--accent-text)" }}>
          Por que esse nome funciona?
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 32, height: 32, background: "var(--accent-subtle)", color: "var(--accent-text)", fontWeight: 700, fontSize: 14 }}
            >
              ✦
            </span>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Memorabilidade</h4>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Fácil de falar, escrever e lembrar. Nomes curtos com sonoridade marcante colam rápido na cultura da empresa.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 32, height: 32, background: "var(--accent-subtle)", color: "var(--accent-text)", fontWeight: 700, fontSize: 14 }}
            >
              ✦
            </span>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Dualidade</h4>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Consegue ser respeitoso (pela sabedoria) e descontraído (pela sonoridade) ao mesmo tempo.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 32, height: 32, background: "var(--accent-subtle)", color: "var(--accent-text)", fontWeight: 700, fontSize: 14 }}
            >
              ✦
            </span>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Identidade</h4>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                O &quot;Sábio que tudo sabe&quot; — um guia confiável para o conhecimento técnico do time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--accent-text)" }}>
          Tecnologias
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { name: "Next.js 15", desc: "Framework React" },
            { name: "Prisma", desc: "ORM & Database" },
            { name: "NextAuth.js", desc: "Autenticação" },
            { name: "TipTap", desc: "Editor rich text" },
            { name: "SQLite", desc: "Banco de dados" },
            { name: "TypeScript", desc: "Tipo seguro" },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-lg p-3"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-muted)" }}
            >
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {t.name}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div
        className="rounded-xl p-5 text-center"
        style={{ background: "var(--accent-subtle)", border: "1px solid rgba(212,160,23,0.2)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--accent-text)" }}>
          Plataforma de Documentação
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Construído com 💛 pelo time de Data Engineering
        </p>
      </div>
    </main>
  );
}
