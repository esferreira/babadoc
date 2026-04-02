<p align="center">
  <img src="https://img.shields.io/badge/Babadoc-v1.0-d4a017?style=for-the-badge&labelColor=0a0a0a" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/SQLite-Local-003B57?style=for-the-badge&logo=sqlite" />
</p>

<h1 align="center">
  🏛️ Baba<span>doc</span>
</h1>

<p align="center">
  <strong>O Guia do Conhecimento</strong> — Plataforma de documentação estruturada para data products, <br/>
  pipelines, regras de negócio e operações de dados.
</p>

<p align="center">
  <em>"Assim como as pessoas buscam um Baba para obter orientação e clareza,<br/>
  os times buscam o Babadoc para encontrar a verdade sobre seus dados."</em>
</p>

---

## 🎯 O Problema

Times de Data Engineering e DataOps enfrentam um ciclo vicioso:

- **Conhecimento siloed** — informação crítica vive na cabeça de 1-2 pessoas
- **Documentação dispersa** — espalhada entre Confluence, SharePoint, OneNote, emails e chats
- **Tombamento frágil** — quando alguém sai do time, o conhecimento vai junto
- **Troubleshooting cego** — sem histórico de incidentes, cada erro é redescoberto do zero
- **Onboarding lento** — novos membros levam semanas para entender um pipeline

## 💡 A Solução

O **Babadoc** estrutura a documentação em torno de um **Roteiro de 38 perguntas** (Discovery Roteiro v1.1) — validado por feedback direto de desenvolvedores — que cobre exatamente o que é necessário para operar, manter e escalar qualquer produto de dados:

| Bloco | Foco | Perguntas |
|-------|------|-----------|
| 📊 **Negócio** | O QUE é, POR QUE existe, PARA QUEM | 16 perguntas |
| 🔧 **Técnico** | COMO funciona, ONDE vive, COM QUE conecta | 17 perguntas |
| 📈 **Entrega** | Power BI, DAX, RLS, Governance IDs | 5 perguntas |

> **94% de alinhamento** com as prioridades reais dos desenvolvedores, baseado em retrospectivas do time (Mar/2026).

---

## ✨ Features

### 📋 Documentação Guiada
- **38 perguntas priorizadas** — 22 Inegociáveis (MVP) + 16 Desejáveis
- **Matriz de Aplicabilidade** — cada tipo de artefato tem um subconjunto relevante de perguntas
- **Editor rich text** (TipTap) com suporte a imagens, links, código e formatação
- **Versionamento automático** — histórico completo de todas as respostas
- **Complementos colaborativos** — múltiplas pessoas adicionam contexto sem sobrescrever

### 🏷️ Organização & Taxonomia
- **11 tipos de artefatos** — Dataset, Notebook, Pipeline, Dashboard, Processo, Troubleshooting, Regra, Decisão, Conceito, Glossário, Sistema
- **Tags multi-categoria** — Domínio, Tecnologia, Zona (Raw/History/Consume), Criticidade
- **Hierarquia corporativa** — Organização → Área → Artefato
- **Status lifecycle** — Rascunho → Publicado → Depreciado → Arquivado

### 🕸️ Grafo de Conhecimento
- **Relacionamentos entre artefatos** — `feeds_into`, `derived_from`, `depends_on`, `implements`, `consumed_by`
- **Visualização interativa** com force-directed graph (react-force-graph-2d)
- **Navegação pelo grafo** — clique em um nó para abrir o artefato

### 📊 Analytics & Cobertura
- **Documentation Score** — percentual de perguntas respondidas por artefato
- **Dashboard de cobertura** — visão consolidada de toda a base de conhecimento
- **View tracking** — quais artefatos e perguntas são mais consultados
- **Agendamento de revisões** — ciclos de 30, 60, 90, 180 ou 365 dias

### 📄 Gerador de Template Offline
- Gera modelo com as 38 perguntas para preenchimento externo
- **3 formatos**: Markdown (Loop/Confluence), HTML Tabela (Word/Email), Texto Puro
- **Filtro por escopo**: Todas (38), MVP (22), Desejáveis (16)
- **Copiar para clipboard** ou **baixar como arquivo**
- Perfeito para times que ainda não usam o Babadoc

### 🔄 Portabilidade (Import/Export)
- **Formato `.babadoc`** — arquivo ZIP portátil com todos os dados + imagens
- **Exporta**: artifacts, respostas, tags, relacionamentos, comentários, imagens embedadas
- **Importa**: merge inteligente por `canonicalName`, sem duplicação
- **Transferência offline** — pen drive, email, OneDrive, Teams
- **Admin-only** para importação com audit trail

### 🔒 RBAC & Colaboração
- **3 papéis**: Admin, Editor, Membro
- **Workflow de aprovação** — propostas de substituição passam por revisão
- **Comentários por pergunta** — discussões vinculadas ao contexto
- **Favoritos** — acesso rápido aos artefatos mais consultados
- **Notificações** — alertas de novos conteúdos, comentários e revisões pendentes
- **Busca global** — pesquisa instantânea por nome, tipo, tag ou conteúdo

### 🌗 Design System
- **Black & Gold** — identidade visual premium com tema dark/light
- **Responsivo** — funciona em desktop e mobile com sidebar colapsável
- **Micro-animações** — transições suaves e feedback visual em todas as interações

---

## 🏗️ Arquitetura

```
babadoc/
├── prisma/
│   ├── schema.prisma          # 14 modelos (Artifact, Facet, Question, Tag, ...)
│   ├── seed.ts                # 38 perguntas + tags + matriz de aplicabilidade
│   └── migrations/            # Histórico de migrações SQL
├── src/
│   ├── actions/               # 12 Server Actions (artifact, facet, graph, ...)
│   ├── app/
│   │   ├── (app)/             # Rotas autenticadas
│   │   │   ├── artifacts/     # CRUD + roteiro de perguntas
│   │   │   ├── coverage/      # Dashboard de cobertura
│   │   │   ├── dashboard/     # Visão geral com stats
│   │   │   ├── graph/         # Grafo de relacionamentos
│   │   │   ├── portability/   # Import/Export de dados
│   │   │   ├── reviews/       # Agendamento de revisões
│   │   │   ├── template/      # Gerador de template offline
│   │   │   ├── admin/         # Gestão de usuários, perguntas, tags
│   │   │   └── components/    # Sidebar, Topbar, Cards, Search, ...
│   │   ├── api/
│   │   │   ├── export/        # GET → gera .babadoc (ZIP)
│   │   │   ├── import/        # POST → importa .babadoc
│   │   │   └── upload/        # POST → upload de imagens
│   │   └── login/             # Tela de autenticação
│   ├── auth.ts                # NextAuth config (Credentials)
│   └── lib/                   # DB connection, RBAC, Storage
└── public/
    └── uploads/               # Imagens enviadas pelos usuários (local)
```

---

## 🚀 Quick Start

### Pré-requisitos
- **Node.js** 18+
- **npm** 9+

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/esferreira/babadoc.git
cd babadoc

# 2. Instale as dependências
npm install

# 3. Configure o banco de dados + usuário admin + 38 perguntas
npm run setup
# Este comando executa: prisma generate → db push → seed
# Cria automaticamente:
#   ✅ Banco SQLite (prisma/dev.db)
#   ✅ Usuário admin (admin@babadoc.local / admin123)
#   ✅ 38 perguntas do Roteiro Discovery
#   ✅ Organização e área padrão

# 4. Inicie o servidor
npm run dev
```

Acesse **[http://localhost:3000](http://localhost:3000)** e faça login com:
- **Email:** `admin@babadoc.local`
- **Senha:** `admin123`

> 💡 **Dica:** Após o primeiro login, altere a senha e crie novos usuários pelo painel Admin.

### Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `setup` | `npm run setup` | Inicializa banco + seed (rodar 1x após clone) |
| `dev` | `npm run dev` | Servidor de desenvolvimento |
| `build` | `npm run build` | Build de produção |
| `start` | `npm run start` | Servidor de produção |

### Variáveis de Ambiente (Opcional)

```env
AUTH_SECRET=sua-chave-secreta-aqui      # Gere com: npx auth secret
AUTH_TRUST_HOST=true                    # Para desenvolvimento local
```
> Se nenhuma variável de ambiente for definida, o projeto usa valores padrão para desenvolvimento local.


---

## 📦 Portabilidade entre Instâncias

O Babadoc pode operar de forma completamente offline e isolada. Para transferir dados entre computadores:

```
Computador A                          Computador B
┌──────────┐    .babadoc file    ┌──────────┐
│  Babadoc ├───────────────────→ │  Babadoc │
│ (origem) │  pen drive / email  │ (destino)│
└──────────┘                     └──────────┘
```

1. No **computador de origem**: acesse `/portability` → clique **Exportar**
2. **Transfira** o arquivo `.babadoc` por qualquer meio
3. No **computador de destino**: acesse `/portability` → faça upload → clique **Importar**

O merge é inteligente — artefatos existentes são atualizados, novos são adicionados, duplicatas são ignoradas.

---

## 📐 O Roteiro Discovery (38 Perguntas)

O coração do Babadoc é o **Roteiro de Documentação**, um framework estruturado baseado no **Dual-Layer Documentation Framework**:

### 📊 Bloco 1 — Negócio (16 perguntas)
| # | Pergunta | Prioridade |
|---|----------|------------|
| 1 | O que é este produto de dados? | 🔒 MVP |
| 2 | Quem usa este dado? | 🔒 MVP |
| 3 | Quem é o dono do produto? | 🔒 MVP |
| 4 | De onde vêm os dados? | 🔒 MVP |
| 5 | Esse produto se relaciona com outros? | 💡 Nice |
| 6 | Quais são as informações mais importantes? | 💡 Nice |
| 7 | Como os valores são calculados? | 🔒 MVP |
| 8 | Existem registros excluídos ou filtrados? | 🔒 MVP |
| 9 | Existe congelamento ou snapshot? | 💡 Nice |
| 10 | Existem exceções às regras? | 🔒 MVP |
| 11 | Existem inputs manuais? | 🔒 MVP |
| 12 | Quando os dados ficam disponíveis? | 🔒 MVP |
| 13 | Onde os dados são consumidos? | 💡 Nice |
| 14 | Quais problemas o usuário costuma ter? | 🔒 MVP |
| 15 | Existem termos ou siglas específicos? | 💡 Nice |
| 16 | Houve mudanças recentes? | 💡 Nice |

### 🔧 Bloco 2 — Técnico (17 perguntas)
| # | Pergunta | Prioridade |
|---|----------|------------|
| 17 | Onde está o código? | 🔒 MVP |
| 18 | Quais camadas o dado percorre? | 🔒 MVP |
| 19 | Pode mostrar os notebooks/scripts? | 🔒 MVP |
| 20 | Quais são as tabelas finais e schemas? | 💡 Nice |
| 21 | De quais fontes upstream depende? | 🔒 MVP |
| 22 | Como as regras estão implementadas? | 🔒 MVP |
| 23 | Quem consome as tabelas finais? | 💡 Nice |
| 24 | Qual é o pipeline/DAG/job? | 🔒 MVP |
| 25 | Quando executa e quanto tempo leva? | 🔒 MVP |
| 26 | Existem alertas de falha? | 💡 Nice |
| 27 | Quais recursos cloud são usados? | 💡 Nice |
| 28 | Como reprocessar do zero? | 🔒 MVP |
| 29 | Como reprocessar parcialmente? | 💡 Nice |
| 30 | Como validar que os dados estão corretos? | 💡 Nice |
| 31 | Como reverter um erro? | 💡 Nice |
| 32 | Quais problemas já aconteceram? | 🔒 MVP |
| 33 | Quais dependências e permissões? | 💡 Nice |

### 📈 Bloco 3 — Entrega / Power BI (5 perguntas)
| # | Pergunta | Prioridade |
|---|----------|------------|
| 34 | Walk-through do dashboard? | 💡 Nice |
| 35 | Existem cálculos DAX? | 🔒 MVP |
| 36 | Qual o tipo de conexão? | 🔒 MVP |
| 37 | Existe segurança (RLS)? | 💡 Nice |
| 38 | IDs do workspace/report/dataset? | 💡 Nice |

---

## 🛠️ Tech Stack

| Tecnologia | Uso | Por que? |
|------------|-----|----------|
| **Next.js 16** | Framework full-stack | App Router, Server Actions, RSC |
| **TypeScript 5** | Tipagem estática | Segurança e DX |
| **Prisma 7** | ORM + Migrations | Type-safe database access |
| **SQLite** | Banco de dados | Zero infra, portável, offline |
| **NextAuth v5** | Autenticação | Credentials provider, session management |
| **TipTap** | Editor rich text | Extensível, headless, markdown |
| **React Force Graph** | Grafo de conhecimento | WebGL, force-directed layout |
| **JSZip** | Portabilidade | Empacotamento e extração de .babadoc |
| **Tailwind CSS 4** | Estilos utilitários | Design system Black & Gold |
| **Zod** | Validação | Schema validation para forms |

---

## 📄 Licença

Projeto interno — uso corporativo.

---

<p align="center">
  Construído com 💛 pelo time de <strong>Data Engineering</strong>
  <br/>
  <sub>O Sábio que tudo sabe sobre seus dados.</sub>
</p>
