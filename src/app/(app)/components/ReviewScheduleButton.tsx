"use client";

import { useState, useTransition, useEffect } from "react";
import { setReviewSchedule, getReviewSchedule, markReviewed } from "@/actions/review";

const FREQUENCIES = [
  { days: 30, label: "Mensal" },
  { days: 60, label: "Bimestral" },
  { days: 90, label: "Trimestral" },
  { days: 180, label: "Semestral" },
  { days: 365, label: "Anual" },
];

export function ReviewScheduleButton({ artifactId }: { artifactId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getReviewSchedule(artifactId).then((data: any) => {
      setCurrent(data);
      setLoaded(true);
    });
  }, [artifactId]);

  function handleSet(days: number) {
    startTransition(async () => {
      await setReviewSchedule(artifactId, days);
      const data = await getReviewSchedule(artifactId);
      setCurrent(data);
      setOpen(false);
    });
  }

  function handleReview() {
    startTransition(async () => {
      await markReviewed(artifactId);
      const data = await getReviewSchedule(artifactId);
      setCurrent(data);
    });
  }

  if (!loaded) return null;

  const isOverdue = current?.nextReviewAt && new Date(current.nextReviewAt) <= new Date();
  const currentFreq = FREQUENCIES.find(f => f.days === current?.frequencyDays);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        className="baba-button-secondary text-sm"
        style={{
          color: isOverdue ? "var(--danger)" : current ? "var(--accent-text)" : "var(--text-muted)",
          borderColor: isOverdue ? "rgba(239,68,68,0.3)" : undefined,
        }}
      >
        📅 {current ? (isOverdue ? "⚠ Revisão atrasada" : `Revisão: ${currentFreq?.label ?? current.frequencyDays + "d"}`) : "Agendar revisão"}
      </button>

      {open && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 12,
            minWidth: 200,
            zIndex: 50,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Frequência de revisão
          </div>
          <div className="flex flex-col gap-1">
            {FREQUENCIES.map(f => (
              <button
                key={f.days}
                onClick={() => handleSet(f.days)}
                disabled={isPending}
                className="text-left text-xs px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: current?.frequencyDays === f.days ? "var(--accent-subtle)" : "transparent",
                  color: current?.frequencyDays === f.days ? "var(--accent-text)" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {current?.frequencyDays === f.days ? "✓ " : ""}{f.label} ({f.days}d)
              </button>
            ))}
          </div>

          {current && (
            <>
              <div className="h-px my-2" style={{ background: "var(--border-muted)" }} />
              <button
                onClick={handleReview}
                disabled={isPending}
                className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                style={{ color: "var(--success)", background: "none", border: "none", cursor: "pointer" }}
              >
                ✓ Marcar como revisado agora
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
