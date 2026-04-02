"use client";

import { useState, useTransition } from "react";
import { exportArtifactMarkdown } from "@/actions/export";

export function ExportButton({ artifactId }: { artifactId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const markdown = await exportArtifactMarkdown(artifactId);
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `artifact-export-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="baba-button-secondary text-sm"
      title="Exportar como Markdown"
    >
      {isPending ? "⏳" : "📤"} Exportar
    </button>
  );
}
