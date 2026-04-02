import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
      "application/pdf",
      "text/plain", "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}` },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx 10MB)" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = path.extname(file.name) || ".bin";
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, uniqueName), buffer);

    const url = `/uploads/${uniqueName}`;

    return NextResponse.json({ url, name: file.name });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
