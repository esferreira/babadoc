import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import JSZip from "jszip";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/import
 * Imports a .babadoc ZIP file and merges data into the current instance.
 * Uses canonical names as merge keys to avoid duplicates.
 * Images are extracted to public/uploads/.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Only admins can import
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem importar dados" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Max 200 MB
    if (file.size > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx 200MB)" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════
    // 1. PARSE ZIP FILE
    // ═══════════════════════════════════════
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const manifestFile = zip.file("manifest.json");
    if (!manifestFile) {
      return NextResponse.json(
        { error: "Arquivo inválido: manifest.json não encontrado" },
        { status: 400 }
      );
    }

    const manifestText = await manifestFile.async("text");
    const manifest = JSON.parse(manifestText);

    if (manifest._meta?.format !== "babadoc-export") {
      return NextResponse.json(
        { error: "Formato de arquivo inválido (esperado: babadoc-export)" },
        { status: 400 }
      );
    }

    const stats = {
      organizations: 0,
      areas: 0,
      artifacts: 0,
      facets: 0,
      tags: 0,
      relationships: 0,
      images: 0,
      comments: 0,
      skipped: 0,
    };

    // ═══════════════════════════════════════
    // 2. IMPORT ORGANIZATIONS & AREAS
    // ═══════════════════════════════════════
    const orgIdMap = new Map<string, string>(); // old ID → new ID

    for (const org of manifest.organizations ?? []) {
      const existing = await prisma.organization.findUnique({
        where: { name: org.name },
      });
      if (existing) {
        orgIdMap.set(org.id, existing.id);
      } else {
        const created = await prisma.organization.create({
          data: { name: org.name },
        });
        orgIdMap.set(org.id, created.id);
        stats.organizations++;
      }
    }

    const areaIdMap = new Map<string, string>();

    for (const area of manifest.areas ?? []) {
      const newOrgId = orgIdMap.get(area.organizationId);
      if (!newOrgId) continue;

      const existing = await prisma.area.findUnique({
        where: { organizationId_name: { organizationId: newOrgId, name: area.name } },
      });
      if (existing) {
        areaIdMap.set(area.id, existing.id);
      } else {
        const created = await prisma.area.create({
          data: { name: area.name, organizationId: newOrgId },
        });
        areaIdMap.set(area.id, created.id);
        stats.areas++;
      }
    }

    // ═══════════════════════════════════════
    // 3. IMPORT TAGS
    // ═══════════════════════════════════════
    const tagIdMap = new Map<string, string>();

    for (const tag of manifest.tags ?? []) {
      const existing = await prisma.tag.findUnique({
        where: { category_value: { category: tag.category, value: tag.value } },
      });
      if (existing) {
        tagIdMap.set(tag.id, existing.id);
      } else {
        const created = await prisma.tag.create({
          data: {
            category: tag.category,
            value: tag.value,
            color: tag.color,
            icon: tag.icon,
          },
        });
        tagIdMap.set(tag.id, created.id);
        stats.tags++;
      }
    }

    // ═══════════════════════════════════════
    // 4. IMPORT QUESTIONS (upsert by order)
    // ═══════════════════════════════════════
    const questionIdMap = new Map<string, string>();

    for (const q of manifest.questions ?? []) {
      const existing = await prisma.question.findUnique({
        where: { order: q.order },
      });
      if (existing) {
        questionIdMap.set(q.id, existing.id);
      } else {
        const created = await prisma.question.create({
          data: {
            order: q.order,
            title: q.title,
            description: q.description,
            category: q.category,
            subCategory: q.subCategory,
            priority: q.priority,
            facetType: q.facetType,
            isActive: q.isActive ?? true,
          },
        });
        questionIdMap.set(q.id, created.id);
      }
    }

    // Question Applicabilities
    for (const qa of manifest.questionApplicabilities ?? []) {
      const newQuestionId = questionIdMap.get(qa.questionId);
      if (!newQuestionId) continue;

      try {
        await prisma.questionApplicability.upsert({
          where: {
            questionId_artifactType: {
              questionId: newQuestionId,
              artifactType: qa.artifactType,
            },
          },
          update: { priority: qa.priority },
          create: {
            questionId: newQuestionId,
            artifactType: qa.artifactType,
            priority: qa.priority,
          },
        });
      } catch {
        // Skip duplicates
      }
    }

    // ═══════════════════════════════════════
    // 5. IMPORT ARTIFACTS (merge by canonicalName)
    // ═══════════════════════════════════════
    const artifactIdMap = new Map<string, string>();

    for (const art of manifest.artifacts ?? []) {
      const newAreaId = areaIdMap.get(art.areaId);
      if (!newAreaId) continue;

      const existing = await prisma.artifact.findUnique({
        where: { canonicalName: art.canonicalName },
      });

      if (existing) {
        // Update existing artifact
        await prisma.artifact.update({
          where: { id: existing.id },
          data: {
            displayName: art.displayName,
            artifactType: art.artifactType,
            status: art.status,
            documentationScore: art.documentationScore,
          },
        });
        artifactIdMap.set(art.id, existing.id);
      } else {
        const created = await prisma.artifact.create({
          data: {
            canonicalName: art.canonicalName,
            displayName: art.displayName,
            artifactType: art.artifactType,
            status: art.status,
            documentationScore: art.documentationScore,
            areaId: newAreaId,
          },
        });
        artifactIdMap.set(art.id, created.id);
        stats.artifacts++;
      }
    }

    // ═══════════════════════════════════════
    // 6. IMPORT ARTIFACT TAGS
    // ═══════════════════════════════════════
    for (const at of manifest.artifactTags ?? []) {
      const newArtifactId = artifactIdMap.get(at.artifactId);
      const newTagId = tagIdMap.get(at.tagId);
      if (!newArtifactId || !newTagId) continue;

      try {
        await (prisma as any).artifactTag.create({
          data: { artifactId: newArtifactId, tagId: newTagId },
        });
      } catch {
        // Already exists, skip
      }
    }

    // ═══════════════════════════════════════
    // 7. IMPORT FACETS (answers)
    // ═══════════════════════════════════════
    // Find or create a system author for imported facets
    let importAuthor = await prisma.user.findFirst({
      where: { email: session.user.email ?? "" },
    });
    if (!importAuthor) {
      importAuthor = user;
    }

    for (const facet of manifest.facets ?? []) {
      const newArtifactId = artifactIdMap.get(facet.artifactId);
      if (!newArtifactId) continue;

      const newQuestionId = facet.questionId
        ? questionIdMap.get(facet.questionId)
        : null;

      // Check if this exact facet already exists (by artifact + question + status)
      if (newQuestionId) {
        const existing = await prisma.facet.findFirst({
          where: {
            artifactId: newArtifactId,
            questionId: newQuestionId,
            status: facet.status,
            isDeleted: false,
          },
        });
        if (existing) {
          stats.skipped++;
          continue; // Don't duplicate answers
        }
      }

      await prisma.facet.create({
        data: {
          artifactId: newArtifactId,
          questionId: newQuestionId,
          facetType: facet.facetType,
          targetAudience: facet.targetAudience ?? "both",
          contentMarkdown: facet.contentMarkdown,
          contentJson: facet.contentJson,
          version: facet.version ?? 1,
          status: facet.status ?? "CURRENT",
          authorId: importAuthor.id,
        },
      });
      stats.facets++;
    }

    // ═══════════════════════════════════════
    // 8. IMPORT RELATIONSHIPS
    // ═══════════════════════════════════════
    for (const rel of manifest.relationships ?? []) {
      const newSourceId = artifactIdMap.get(rel.sourceArtifactId);
      const newTargetId = artifactIdMap.get(rel.targetArtifactId);
      if (!newSourceId || !newTargetId) continue;

      try {
        await prisma.artifactRelationship.create({
          data: {
            sourceArtifactId: newSourceId,
            targetArtifactId: newTargetId,
            relationshipType: rel.relationshipType,
            description: rel.description,
          },
        });
        stats.relationships++;
      } catch {
        // Duplicate relationship, skip
      }
    }

    // ═══════════════════════════════════════
    // 9. IMPORT COMMENTS
    // ═══════════════════════════════════════
    for (const comment of manifest.comments ?? []) {
      const newArtifactId = artifactIdMap.get(comment.artifactId);
      if (!newArtifactId) continue;

      const newQuestionId = comment.questionId
        ? questionIdMap.get(comment.questionId)
        : null;

      await prisma.comment.create({
        data: {
          content: comment.content,
          artifactId: newArtifactId,
          questionId: newQuestionId,
          authorId: importAuthor.id,
        },
      });
      stats.comments++;
    }

    // ═══════════════════════════════════════
    // 10. IMPORT REVIEW SCHEDULES
    // ═══════════════════════════════════════
    for (const rs of manifest.reviewSchedules ?? []) {
      const newArtifactId = artifactIdMap.get(rs.artifactId);
      if (!newArtifactId) continue;

      try {
        await prisma.reviewSchedule.upsert({
          where: { artifactId: newArtifactId },
          update: {
            frequencyDays: rs.frequencyDays,
            lastReviewedAt: rs.lastReviewedAt ? new Date(rs.lastReviewedAt) : null,
            nextReviewAt: rs.nextReviewAt ? new Date(rs.nextReviewAt) : null,
          },
          create: {
            artifactId: newArtifactId,
            frequencyDays: rs.frequencyDays,
            lastReviewedAt: rs.lastReviewedAt ? new Date(rs.lastReviewedAt) : null,
            nextReviewAt: rs.nextReviewAt ? new Date(rs.nextReviewAt) : null,
          },
        });
      } catch {
        // Skip
      }
    }

    // ═══════════════════════════════════════
    // 11. EXTRACT IMAGES FROM ZIP
    // ═══════════════════════════════════════
    const imagesFolder = zip.folder("images");
    if (imagesFolder) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");

      const imagePromises: Promise<void>[] = [];
      imagesFolder.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        imagePromises.push(
          (async () => {
            const destPath = path.join(uploadsDir, relativePath);
            const destDir = path.dirname(destPath);
            await fs.mkdir(destDir, { recursive: true });

            // Don't overwrite existing images
            try {
              await fs.access(destPath);
              // File exists, skip
            } catch {
              const buffer = await zipEntry.async("nodebuffer");
              await fs.writeFile(destPath, buffer);
              stats.images++;
            }
          })()
        );
      });

      await Promise.all(imagePromises);
    }

    // ═══════════════════════════════════════
    // 12. UPDATE DOCUMENTATION SCORES
    // ═══════════════════════════════════════
    for (const [, newId] of artifactIdMap) {
      try {
        const totalQuestions = await prisma.question.count({ where: { isActive: true } });
        const answeredCount = await prisma.facet.count({
          where: {
            artifactId: newId,
            status: "CURRENT",
            isDeleted: false,
            questionId: { not: null },
          },
        });
        const score = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
        await prisma.artifact.update({
          where: { id: newId },
          data: { documentationScore: score },
        });
      } catch {
        // Non-critical
      }
    }

    // ═══════════════════════════════════════
    // 13. LOG THE IMPORT
    // ═══════════════════════════════════════
    await prisma.auditLog.create({
      data: {
        entityType: "system",
        entityId: "import",
        action: "import",
        detail: `Importação de ${stats.artifacts} artifacts, ${stats.facets} respostas, ${stats.images} imagens`,
        performedBy: session.user.id,
        newValues: JSON.stringify(stats),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Importação concluída com sucesso",
      stats,
      source: {
        exportedAt: manifest._meta?.exportedAt,
        exportedBy: manifest._meta?.exportedBy,
        originalStats: manifest._meta?.stats,
      },
    });
  } catch (err) {
    console.error("[Import] Error:", err);
    return NextResponse.json(
      { error: `Erro ao importar: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
