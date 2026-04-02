import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding Babadoc database...");

  // ====== 1. CREATE ADMIN USER ======
  const hashedPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      email: "admin@empresa.com",
      name: "Administrador",
      hashedPassword,
      role: "admin",
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // ====== 2. SEED 38 QUESTIONS (Roteiro Priorizado) ======
  const questions = [
    // === BLOCO 1: NEGÓCIO ===
    // 1.1 Contexto e Definição
    { order: 1, title: "O que é este produto de dados?", description: "Definição em 1-2 frases. Qual problema de negócio resolve? Por que foi criado?", category: "BUSINESS", subCategory: "1.1 Contexto e Definição", priority: "MUST", facetType: "business_overview" },
    { order: 2, title: "Quem usa este dado?", description: "Quais áreas, gerências ou times? Existe consumidor externo?", category: "BUSINESS", subCategory: "1.1 Contexto e Definição", priority: "MUST", facetType: "business_overview" },
    { order: 3, title: "Quem é o dono do produto?", description: "Quem responde pelas regras de negócio? Quem é o contato para dúvidas? E para problemas técnicos?", category: "BUSINESS", subCategory: "1.1 Contexto e Definição", priority: "MUST", facetType: "contacts" },
    { order: 4, title: "De onde vêm os dados?", description: "Explicação simplificada: sistema A → processamento → dashboard/relatório. Sem detalhes técnicos.", category: "BUSINESS", subCategory: "1.1 Contexto e Definição", priority: "MUST", facetType: "lineage" },
    { order: 5, title: "Esse produto se relaciona com outros?", description: "Alimenta ou é alimentado por outros produtos? Compõem um indicador maior?", category: "BUSINESS", subCategory: "1.1 Contexto e Definição", priority: "NICE", facetType: "lineage" },
    { order: 6, title: "Quais são as informações mais importantes?", description: "Os 8-10 campos/métricas principais que o usuário consulta. O que cada um significa?", category: "BUSINESS", subCategory: "1.1 Contexto e Definição", priority: "NICE", facetType: "schema" },

    // 1.2 Regras de Negócio
    { order: 7, title: "Como os valores são calculados?", description: "Walk-through com exemplo numérico real. Fórmula conceitual (sem código).", category: "BUSINESS", subCategory: "1.2 Regras de Negócio", priority: "MUST", facetType: "rules" },
    { order: 8, title: "Existem registros excluídos ou filtrados?", description: "Critérios de exclusão (status, tipo, data de corte). Por que essas regras existem?", category: "BUSINESS", subCategory: "1.2 Regras de Negócio", priority: "MUST", facetType: "rules" },
    { order: 9, title: "Existe congelamento ou snapshot?", description: "Os dados 'travam' em algum momento? É automático (data) ou manual (aprovação)?", category: "BUSINESS", subCategory: "1.2 Regras de Negócio", priority: "NICE", facetType: "rules" },
    { order: 10, title: "Existem exceções às regras?", description: "Quem autoriza exceções? Existe processo formal? Exemplos de concessões.", category: "BUSINESS", subCategory: "1.2 Regras de Negócio", priority: "MUST", facetType: "rules" },
    { order: 11, title: "Existem inputs manuais?", description: "Listas em SharePoint, planilhas Excel, formulários? Quem gerencia? Com que frequência mudam?", category: "BUSINESS", subCategory: "1.2 Regras de Negócio", priority: "MUST", facetType: "rules" },

    // 1.3 Operação e Uso
    { order: 12, title: "Quando os dados ficam disponíveis?", description: "Frequência (diário, semanal, mensal). Horário de disponibilidade para o usuário.", category: "BUSINESS", subCategory: "1.3 Operação e Uso", priority: "MUST", facetType: "frequency" },
    { order: 13, title: "Onde os dados são consumidos?", description: "Dashboards, relatórios, APIs? Links quando possível.", category: "BUSINESS", subCategory: "1.3 Operação e Uso", priority: "NICE", facetType: "usage" },
    { order: 14, title: "Quais problemas o usuário costuma ter?", description: "Problemas comuns + o que verificar antes de escalar. Checklist L1 de auto-serviço.", category: "BUSINESS", subCategory: "1.3 Operação e Uso", priority: "MUST", facetType: "troubleshooting" },
    { order: 15, title: "Existem termos ou siglas específicos?", description: "Glossário do domínio. Definições que o usuário precisa conhecer.", category: "BUSINESS", subCategory: "1.3 Operação e Uso", priority: "NICE", facetType: "glossary" },
    { order: 16, title: "Houve mudanças recentes?", description: "O que mudou nos últimos meses? Impacto para o usuário?", category: "BUSINESS", subCategory: "1.3 Operação e Uso", priority: "NICE", facetType: "history" },

    // === BLOCO 2: TÉCNICO ===
    // 2.1 Arquitetura e Dados
    { order: 17, title: "Onde está o código?", description: "Repositório, branch principal, estrutura de pastas. Temos acesso de leitura?", category: "TECHNICAL", subCategory: "2.1 Arquitetura e Dados", priority: "MUST", facetType: "technical_spec" },
    { order: 18, title: "Quais camadas o dado percorre?", description: "Raw → History → Consume? Delta, Parquet, Synapse? Tipo: fato, dimensão, agregado?", category: "TECHNICAL", subCategory: "2.1 Arquitetura e Dados", priority: "MUST", facetType: "lineage" },
    { order: 19, title: "Pode mostrar os notebooks/scripts principais?", description: "Demo dos notebooks de transformação. Quais são críticos? Ordem de execução?", category: "TECHNICAL", subCategory: "2.1 Arquitetura e Dados", priority: "MUST", facetType: "pipeline" },
    { order: 20, title: "Quais são as tabelas finais e seus schemas?", description: "Colunas, tipos, PKs, particionamento, distribuição. Dicionário de dados completo.", category: "TECHNICAL", subCategory: "2.1 Arquitetura e Dados", priority: "NICE", facetType: "schema" },
    { order: 21, title: "De quais fontes/tabelas upstream depende?", description: "Cada fonte: servidor, tabela, frequência, volume, chave de join. Quem mantém?", category: "TECHNICAL", subCategory: "2.1 Arquitetura e Dados", priority: "MUST", facetType: "dependencies" },
    { order: 22, title: "Como as regras de negócio estão implementadas?", description: "Código SQL/Python das regras. Edge cases. Workarounds ativos. Bugs conhecidos.", category: "TECHNICAL", subCategory: "2.1 Arquitetura e Dados", priority: "MUST", facetType: "rules" },
    { order: 23, title: "Quem consome as tabelas finais?", description: "Power BI, APIs, Excel, outros pipelines? Modo de conexão, volume de queries, campos usados.", category: "TECHNICAL", subCategory: "2.1 Arquitetura e Dados", priority: "NICE", facetType: "consumers" },

    // 2.2 Orquestração e Infra
    { order: 24, title: "Qual é o pipeline/DAG/job?", description: "Orquestrador (ADF, Airflow, Workflow). Nome, estrutura, tasks, dependências.", category: "TECHNICAL", subCategory: "2.2 Orquestração e Infra", priority: "MUST", facetType: "pipeline" },
    { order: 25, title: "Quando executa e quanto tempo leva?", description: "Schedule (cron, evento). Duração média. SLA de processamento.", category: "TECHNICAL", subCategory: "2.2 Orquestração e Infra", priority: "MUST", facetType: "sla" },
    { order: 26, title: "Existem alertas de falha?", description: "Alertas configurados? Quem recebe? Qual canal?", category: "TECHNICAL", subCategory: "2.2 Orquestração e Infra", priority: "NICE", facetType: "sla" },
    { order: 27, title: "Quais recursos cloud são usados?", description: "Recursos Azure: cluster, SKU, custo estimado, permissões necessárias.", category: "TECHNICAL", subCategory: "2.2 Orquestração e Infra", priority: "NICE", facetType: "infrastructure" },

    // 2.3 Contingência e Troubleshooting
    { order: 28, title: "Como reprocessar do zero?", description: "Step-by-step completo. Quanto tempo? Risco de duplicação?", category: "TECHNICAL", subCategory: "2.3 Contingência e Troubleshooting", priority: "MUST", facetType: "troubleshooting" },
    { order: 29, title: "Como reprocessar parcialmente?", description: "É possível reprocessar só um período, unidade ou partição? Como?", category: "TECHNICAL", subCategory: "2.3 Contingência e Troubleshooting", priority: "NICE", facetType: "troubleshooting" },
    { order: 30, title: "Como validar que os dados estão corretos?", description: "Queries de validação. Contagens esperadas. Comparações fonte vs destino.", category: "TECHNICAL", subCategory: "2.3 Contingência e Troubleshooting", priority: "NICE", facetType: "troubleshooting" },
    { order: 31, title: "Como reverter um erro?", description: "Rollback disponível? Delta Time Travel? Backup?", category: "TECHNICAL", subCategory: "2.3 Contingência e Troubleshooting", priority: "NICE", facetType: "troubleshooting" },
    { order: 32, title: "Quais problemas já aconteceram?", description: "Incidentes históricos. Como foram resolvidos. Workarounds ativos.", category: "TECHNICAL", subCategory: "2.3 Contingência e Troubleshooting", priority: "MUST", facetType: "troubleshooting" },
    { order: 33, title: "Quais dependências e permissões são necessárias?", description: "Libs, pacotes, Service Principals, roles. O que precisa para rodar?", category: "TECHNICAL", subCategory: "2.3 Contingência e Troubleshooting", priority: "NICE", facetType: "dependencies" },

    // === BLOCO 3: ENTREGA / POWER BI ===
    { order: 34, title: "Pode fazer um walk-through do dashboard?", description: "Todas as páginas, filtros mais usados, páginas ocultas/admin.", category: "DELIVERY", subCategory: "3.1 Entrega / Power BI", priority: "NICE", facetType: "walkthrough" },
    { order: 35, title: "Existem cálculos no Power BI (DAX)?", description: "Medidas DAX críticas ou tudo vem pronto da camada Gold?", category: "DELIVERY", subCategory: "3.1 Entrega / Power BI", priority: "MUST", facetType: "consumers" },
    { order: 36, title: "Qual o tipo de conexão?", description: "Import, DirectQuery, LiveConnection? Schedule de refresh?", category: "DELIVERY", subCategory: "3.1 Entrega / Power BI", priority: "MUST", facetType: "connection" },
    { order: 37, title: "Existe segurança de dados (RLS)?", description: "Row-Level Security? Quem vê o quê? Como é gerenciado?", category: "DELIVERY", subCategory: "3.1 Entrega / Power BI", priority: "NICE", facetType: "rls" },
    { order: 38, title: "Quais são os IDs do workspace/report/dataset?", description: "IDs para monitoramento e automação.", category: "DELIVERY", subCategory: "3.1 Entrega / Power BI", priority: "NICE", facetType: "ids" },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { order: q.order },
      update: q,
      create: q,
    });
  }
  console.log(`✅ ${questions.length} questions seeded (${questions.filter(q => q.priority === "MUST").length} MUST, ${questions.filter(q => q.priority === "NICE").length} NICE)`);

  // ====== 3. SEED TAGS ======
  const tags = [
    // Domains
    { category: "domain", value: "FrequenciaCIP", color: "#3B82F6", icon: "🧹" },
    { category: "domain", value: "MES_Athena", color: "#10B981", icon: "🏭" },
    { category: "domain", value: "BMS", color: "#F59E0B", icon: "🍺" },
    { category: "domain", value: "P3M", color: "#EC4899", icon: "🔧" },
    { category: "domain", value: "Anaplan", color: "#EF4444", icon: "📊" },
    { category: "domain", value: "SensoryOne", color: "#06B6D4", icon: "👃" },
    { category: "domain", value: "Smartcheck", color: "#8B5CF6", icon: "✅" },
    // Technologies
    { category: "technology", value: "Databricks", color: "#FF6B00", icon: "⚡" },
    { category: "technology", value: "Synapse", color: "#0078D4", icon: "🔷" },
    { category: "technology", value: "ADF", color: "#0066B8", icon: "🔄" },
    { category: "technology", value: "PowerBI", color: "#F2C811", icon: "📈" },
    { category: "technology", value: "Python", color: "#3776AB", icon: "🐍" },
    { category: "technology", value: "SharePoint", color: "#038387", icon: "📋" },
    // Zones
    { category: "zone", value: "Raw", color: "#6B7280", icon: "📥" },
    { category: "zone", value: "History", color: "#3B82F6", icon: "📚" },
    { category: "zone", value: "Consume", color: "#10B981", icon: "📤" },
    // Criticality
    { category: "criticality", value: "Critical", color: "#DC2626", icon: "🔴" },
    { category: "criticality", value: "High", color: "#F97316", icon: "🟠" },
    { category: "criticality", value: "Medium", color: "#FBBF24", icon: "🟡" },
    { category: "criticality", value: "Low", color: "#22C55E", icon: "🟢" },
  ];

  for (const t of tags) {
    await prisma.tag.upsert({
      where: { category_value: { category: t.category, value: t.value } },
      update: t,
      create: t,
    });
  }
  console.log(`✅ ${tags.length} tags seeded`);

  // ====== 4. SEED SAMPLE ORGANIZATION ======
  const org = await prisma.organization.upsert({
    where: { name: "Empresa" },
    update: {},
    create: { name: "Empresa" },
  });

  await prisma.area.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Supply" } },
    update: {},
    create: { name: "Supply", organizationId: org.id },
  });

  await prisma.area.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Logística" } },
    update: {},
    create: { name: "Logística", organizationId: org.id },
  });

  console.log(`✅ Organization Empresa seeded with areas: Supply, Logística`);

  // ====== 5. SEED QUESTION APPLICABILITY MATRIX ======
  // Perguntas que NÃO SE APLICAM (NA) para cada tipo de artefato.
  // Se não listado, usa o priority default da pergunta (MUST ou NICE).
  const NA_OVERRIDES: Record<string, number[]> = {
    // Glossário: não tem pipeline, schema, infra, Power BI, etc
    glossary: [4,5,6,7,8,9,10,11,12,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,34,35,36,37,38],
    // Conceito: definição conceitual, sem infra/pipeline/BI
    concept: [6,9,11,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,33,34,35,36,37,38],
    // Decisão: registro de decisão, sem infra técnica
    decision: [6,9,11,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,33,34,35,36,37,38],
    // Regra: foco em regras de negócio, sem pipeline/infra/BI
    rule: [5,6,9,12,17,18,19,20,21,23,24,25,26,27,28,29,30,31,33,34,35,36,37,38],
    // Troubleshooting: foco em resolução, sem BI nem regras complexas
    troubleshooting: [5,6,7,8,9,10,11,12,15,16,20,23,34,35,36,37,38],
    // Processo: tem regras e execução, mas sem BI necessariamente
    process: [6,20,34,35,36,37,38],
    // Sistema: referência de sistema, sem pipeline detalhado ou BI
    system: [5,6,7,8,9,10,11,19,20,23,34,35,36,37,38],
    // Novos tipos granulares do PMO Roteiro MVP:
    dataset: [19,34,35,36,37,38],
    notebook: [6,10,11,12,14,20,34,35,36,37,38],
    pipeline: [6,7,8,9,10,11,19,20,34,35,36,37,38],
    dashboard: [17,18,19,20,24,25,26,27,28,29,30,31,33],
  };

  const allQuestions = await prisma.question.findMany();
  const questionByOrder = new Map(allQuestions.map(q => [q.order, q]));
  let applicabilityCount = 0;

  for (const [artifactType, naOrders] of Object.entries(NA_OVERRIDES)) {
    for (const order of naOrders) {
      const question = questionByOrder.get(order);
      if (!question) continue;

      await prisma.questionApplicability.upsert({
        where: {
          questionId_artifactType: { questionId: question.id, artifactType },
        },
        update: { priority: "NA" },
        create: {
          questionId: question.id,
          artifactType,
          priority: "NA",
        },
      });
      applicabilityCount++;
    }
  }

  console.log(`✅ ${applicabilityCount} question applicability overrides seeded`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
