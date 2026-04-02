import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// API route para sendBeacon (beforeunload tracking)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const session = await auth();

    await prisma.viewLog.create({
      data: {
        artifactId: data.artifactId,
        questionId: data.questionId ?? null,
        userId: session?.user?.id ?? null,
        durationMs: data.durationMs ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
