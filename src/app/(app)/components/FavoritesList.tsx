"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFavorites } from "@/actions/social";

const TYPE_ICONS: Record<string, string> = {
  dataset: "📊", notebook: "📓", pipeline: "🔄", dashboard: "📈", process: "⚙️", troubleshooting: "🔧",
  rule: "📏", decision: "🎯", concept: "💡", glossary: "📖", system: "🖥️",
};

export function FavoritesList() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFavorites().then((data) => {
      setFavorites(data);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (favorites.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-2" style={{ color: "var(--text-muted)" }}>
        ⭐ Favoritos
      </div>
      {favorites.slice(0, 5).map((art: any) => (
        <Link
          key={art.id}
          href={`/artifacts/${art.id}`}
          className="baba-nav-item"
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          <span style={{ fontSize: 14 }}>{TYPE_ICONS[art.artifactType] ?? "📄"}</span>
          <span className="truncate">{art.displayName}</span>
        </Link>
      ))}
      {favorites.length > 5 && (
        <div className="text-xs px-3 py-1" style={{ color: "var(--text-muted)" }}>
          +{favorites.length - 5} mais
        </div>
      )}
    </div>
  );
}
