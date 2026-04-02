"use client";

import { useState, useTransition, useEffect } from "react";
import { addComment, getComments } from "@/actions/social";

interface Comment {
  id: string;
  content: string;
  author: { name: string | null; email: string };
  createdAt: string;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function CommentsSection({
  artifactId,
  questionId,
}: {
  artifactId: string;
  questionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  function loadComments() {
    setLoading(true);
    getComments(artifactId, questionId).then((data: any) => {
      setComments(data);
      setLoading(false);
    });
  }

  function handleToggle() {
    if (!open) loadComments();
    setOpen(!open);
  }

  function handleSubmit() {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment(artifactId, questionId, newComment);
      setNewComment("");
      loadComments();
    });
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={handleToggle}
        className="text-xs flex items-center gap-1.5 hover:underline"
        style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        💬 {open ? "Fechar" : "Comentários"}
        {comments.length > 0 && !open && (
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{ background: "var(--accent-subtle)", color: "var(--accent-text)", fontSize: 10 }}
          >
            {comments.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 animate-fade-in" style={{ marginLeft: 0 }}>
          {/* Comment input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Adicionar comentário..."
              className="baba-input"
              style={{ fontSize: 12, padding: "6px 10px" }}
              disabled={isPending}
            />
            <button
              onClick={handleSubmit}
              disabled={isPending || !newComment.trim()}
              className="baba-button-primary"
              style={{ fontSize: 11, padding: "6px 12px", whiteSpace: "nowrap" }}
            >
              {isPending ? "..." : "Enviar"}
            </button>
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Carregando...</div>
          ) : comments.length === 0 ? (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Nenhum comentário ainda</div>
          ) : (
            <div className="flex flex-col gap-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg p-2.5"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-muted)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {c.author.name ?? c.author.email}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
