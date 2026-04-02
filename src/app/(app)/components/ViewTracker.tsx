"use client";

import { useEffect, useRef } from "react";
import { logView } from "@/actions/analytics";

interface ViewTrackerProps {
  artifactId: string;
  questionId?: string;
}

export function ViewTracker({ artifactId, questionId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      logView(artifactId, questionId);
    }
  }, [artifactId, questionId]);

  return null;
}
