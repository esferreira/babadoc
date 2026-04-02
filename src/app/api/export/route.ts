import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import JSZip from "jszip";
import fs from "fs/promises";
import path from "path";

/**
 * GET /api/export
 * Exports all Babadoc data (artifacts, facets, tags, relationships, images)
 * as a single .babadoc ZIP file for portable transfer between instances.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    // ═══════════════════════════════════════
    // 1. FETCH ALL DATA FROM DATABASE
    // ═══════════════════════════════════════
    const [
      organizations,
      areas,
      artifacts,
      questions,
      questionApplicabilities,
      facets,
      tags,
      artifactTags,
      relationships,
      attachments,
      comments,
      reviewSchedules,
    ] = await Promise.all([
      prisma.organization.findMany(),
      prisma.area.findMany(),
      prisma.artifact.findMany(),
      prisma.question.findMany({ orderBy: { order: "asc" } }),
      prisma.questionApplicability.findMany(),
      prisma.facet.findMany({
        where: { isDeleted: false },
        include: { author: { select: { email: true, name: true } } },
      }),
      prisma.tag.findMany(),
      (prisma as any).artifactTag.findMany(),
      prisma.artifactRelationship.findMany(),
      prisma.attachment.findMany(),
      prisma.comment.findMany({
        include: { author: { select: { email: true, name: true } } },
      }),
      prisma.reviewSchedule.findMany(),
    ]);

    // ═══════════════════════════════════════
    // 2. SCAN FOR IMAGE REFERENCES IN FACETS
    // ═══════════════════════════════════════
    const imageRegex = /(?:src=["']|!\[.*?\]\()\/uploads\/([^"'\s)]+)/g;
    const referencedImages = new Set<string>();

    for (const facet of facets) {
      const content = (facet as any).contentMarkdown ?? (facet as any).contentJson ?? "";
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        referencedImages.add(match[1]);
      }
    }

    // Also add images from Attachment records
    for (const att of attachments) {
      const relPath = att.storedPath.replace(/^\/?(uploads\/)?/, "");
      referencedImages.add(relPath);
    }

    // ═══════════════════════════════════════
    // 3. BUILD MANIFEST JSON 
    // ═══════════════════════════════════════
    const manifest = {
      _meta: {
        format: "babadoc-export",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email ?? session.user.name ?? "unknown",
        stats: {
          organizations: organizations.length,
          areas: areas.length,
          artifacts: artifacts.length,
          facets: facets.length,
          tags: tags.length,
          relationships: relationships.length,
          images: referencedImages.size,
          comments: comments.length,
        },
      },
      organizations,
      areas,
      artifacts: artifacts.map((a) => ({
        ...a,
        // Remove internal auto-generated timestamps for cleaner export
      })),
      questions,
      questionApplicabilities,
      facets: facets.map((f: any) => ({
        id: f.id,
        artifactId: f.artifactId,
        questionId: f.questionId,
        facetType: f.facetType,
        targetAudience: f.targetAudience,
        contentMarkdown: f.contentMarkdown,
        contentJson: f.contentJson,
        version: f.version,
        status: f.status,
        previousId: f.previousId,
        authorEmail: f.author?.email,
        authorName: f.author?.name,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      tags,
      artifactTags,
      relationships,
      attachments,
      comments: comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        artifactId: c.artifactId,
        questionId: c.questionId,
        authorEmail: c.author?.email,
        authorName: c.author?.name,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      reviewSchedules,
    };

    // ═══════════════════════════════════════
    // 4. BUILD ZIP FILE
    // ═══════════════════════════════════════
    const zip = new JSZip();

    // Add manifest
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // Add images
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    let imagesAdded = 0;

    for (const imgPath of referencedImages) {
      try {
        const fullPath = path.join(uploadsDir, imgPath);
        const buffer = await fs.readFile(fullPath);
        zip.file(`images/${imgPath}`, buffer);
        imagesAdded++;
      } catch {
        // Image file not found locally, skip it
        console.warn(`[Export] Image not found, skipping: ${imgPath}`);
      }
    }

    console.log(`[Export] ${imagesAdded}/${referencedImages.size} images packaged`);

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // ═══════════════════════════════════════
    // 5. RETURN AS DOWNLOADABLE FILE
    // ═══════════════════════════════════════
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `babadoc_export_${timestamp}.babadoc`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (err) {
    console.error("[Export] Error:", err);
    return NextResponse.json(
      { error: "Erro ao exportar dados" },
      { status: 500 }
    );
  }
}
