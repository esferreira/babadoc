"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ width: 24, height: 24 }} />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
      title="Alternar Tema"
      style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
