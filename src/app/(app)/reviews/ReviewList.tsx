"use client";

import { useTransition } from "react";
import { markReviewed } from "@/actions/review";

export function ReviewList({ artifactId }: { artifactId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleReview() {
    startTransition(async () => {
      await markReviewed(artifactId);
    });
  }

  return (
    <button
      onClick={handleReview}
      disabled={isPending}
      className="baba-button-secondary text-xs flex-shrink-0"
      style={{ whiteSpace: "nowrap" }}
    >
      {isPending ? "..." : "✓ Revisar"}
    </button>
  );
}
