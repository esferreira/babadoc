"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/actions/social";

export function FavoriteButton({ artifactId, initialFav }: { artifactId: string; initialFav: boolean }) {
  const [isFav, setIsFav] = useState(initialFav);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavorite(artifactId);
      if (result && "isFavorite" in result) {
        setIsFav(result.isFavorite as boolean);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="baba-button-secondary text-sm"
      style={{
        color: isFav ? "var(--accent-text)" : "var(--text-muted)",
        borderColor: isFav ? "rgba(212,160,23,0.3)" : undefined,
      }}
      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      {isFav ? "⭐" : "☆"} {isFav ? "Favoritado" : "Favoritar"}
    </button>
  );
}
