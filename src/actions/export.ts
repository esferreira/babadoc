"use server";

import { prisma } from "@/lib/db";

export async function exportArtifactMarkdown(artifactId: string): Promise<string> {
  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
    include: {
      area: { include: { organization: true } },
      owner: { select: { name: true, email: true } },
      tags: { include: { tag: true } },
      facets: {
        where: { isDeleted: false, OR: [{ status: "CURRENT" }, { status: "COMPLEMENT" }] } as any,
        include: {
          question: true,
          author: { select: { name: true, email: true } },
        },
        orderBy: { question: { order: "asc" } } as any,
      },
    },
  });

  if (!artifact) return "# Artifact não encontrado";

  const lines: string[] = [];
  lines.push(`# ${artifact.displayName}`);
  lines.push("");
  lines.push(`> **Canonical Name:** \`${artifact.canonicalName}\``);
  lines.push(`> **Tipo:** ${artifact.artifactType}`);
  lines.push(`> **Status:** ${artifact.status}`);
  lines.push(`> **Área:** ${artifact.area.organization.name} › ${artifact.area.name}`);
  if (artifact.owner) {
    lines.push(`> **Owner:** ${artifact.owner.name ?? artifact.owner.email}`);
  }
  if ((artifact as any).tags?.length > 0) {
    const tagStr = (artifact as any).tags.map((t: any) => `\`${t.tag.category}:${t.tag.value}\``).join(", ");
    lines.push(`> **Tags:** ${tagStr}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Group by category
  const categories = new Map<string, any[]>();
  for (const f of (artifact as any).facets) {
    if (!f.question) continue;
    const cat = f.question.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(f);
  }

  const catLabels: Record<string, string> = {
    BUSINESS: "📋 Negócio",
    TECHNICAL: "🔧 Técnico",
    DELIVERY: "🚀 Entrega",
  };

  for (const [cat, facets] of categories) {
    lines.push(`## ${catLabels[cat] ?? cat}`);
    lines.push("");

    for (const f of facets) {
      const statusTag = f.status === "COMPLEMENT" ? " *(Complemento)*" : "";
      lines.push(`### ${f.question.order}. ${f.question.title}${statusTag}`);
      lines.push("");

      // Strip HTML tags for plain markdown
      const content = (f.contentMarkdown ?? "")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<\/p>/g, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      lines.push(content);
      lines.push("");
      lines.push(`*— ${f.author.name ?? f.author.email}, v${f.version}*`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(`*Exportado do Babadoc em ${new Date().toLocaleDateString("pt-BR")}*`);

  return lines.join("\n");
}
