"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { upsertFacet } from "@/actions/facet";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";

interface FacetEditorProps {
  artifactId: string;
  questionId: string;
  questionTitle: string;
  questionDescription?: string | null;
  facetType: string;
  currentContent?: string;
  currentVersion?: number;
  isComplement?: boolean;
  submissionMode?: "complement" | "replacement";
  artifactType?: string;
  onSaved?: () => void;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  dataset: "<h2>🎯 Objetivo</h2><p></p><h2>🔗 Fontes</h2><ul><li><p></p></li></ul>", notebook: "<h2>🎯 Objetivo</h2><p></p><h2>🛠️ Lógica</h2><p></p>", pipeline: "<h2>🎯 Objetivo</h2><p></p><h2>🔄 Fluxo</h2><p></p>", dashboard: "<h2>🎯 Objetivo</h2><p></p><h2>📈 Painéis</h2><p></p>",
  process: "<h2>🔄 Descrição do Fluxo</h2><p></p><h2>👨‍💻 Atores/Sistemas Envolvidos</h2><ul><li><p></p></li></ul><h2>✅ Resultados Esperados</h2><p></p>",
  troubleshooting: "<h2>⚠️ Sintoma / Problema</h2><p></p><h2>🔍 Análise da Causa Raiz</h2><p></p><h2>✅ Passo a Passo da Resolução</h2><p></p>",
  rule: "<h2>📜 Definição da Regra</h2><p></p><h2>🚫 Exceções Conhecidas</h2><ul><li><p></p></li></ul>",
};

export function FacetEditor({
  artifactId,
  questionId,
  questionTitle,
  questionDescription,
  facetType,
  currentContent = "",
  currentVersion,
  isComplement = false,
  submissionMode,
  artifactType,
  onSaved,
}: FacetEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Image.configure({
        HTMLAttributes: { class: "baba-editor-img" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "baba-editor-link" },
      }),
      Placeholder.configure({
        placeholder: submissionMode === "replacement"
          ? "Escreva a nova resposta que substituirá a atual (requer aprovação)..."
          : isComplement
          ? "Escreva seu complemento aqui..."
          : "Escreva sua resposta aqui...",
      }),
    ],
    content: currentContent || (!isComplement && artifactType ? DEFAULT_TEMPLATES[artifactType] || "" : ""),
    editorProps: {
      attributes: {
        class: "baba-editor-content",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: data.name ?? "" }).run();
        } else {
          setError(data.error ?? "Erro ao fazer upload");
        }
      } catch {
        setError("Erro ao fazer upload da imagem");
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadAndInsertImage(file);
    e.target.value = "";
  }

  function handleAddLink() {
    if (!editor) return;
    const url = window.prompt("URL do link:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  function handleSave() {
    if (!editor) return;
    setError(null);
    setSaved(false);
    const html = editor.getHTML();
    startTransition(async () => {
      const result = await upsertFacet({
        artifactId,
        questionId,
        contentMarkdown: html,
        facetType,
        isComplement: isComplement || submissionMode === "complement",
        submissionMode: submissionMode ?? undefined,
      });
      if ("error" in result && result.error) {
        setError(result.error as string);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        onSaved?.();
      }
    });
  }

  if (!editor) return null;

  // Label do botão baseado no modo
  const saveLabel = isPending
    ? "Salvando..."
    : submissionMode === "replacement"
    ? "📨 Enviar para Aprovação"
    : isComplement || submissionMode === "complement"
    ? "💬 Salvar Complemento"
    : "Salvar";

  return (
    <div className="flex flex-col gap-3">
      {/* Question context */}
      <div
        className="rounded-xl p-4"
        style={{
          background: submissionMode === "replacement" ? "rgba(251,191,36,0.08)" : "var(--accent-subtle)",
          border: submissionMode === "replacement" ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(212,160,23,0.3)",
        }}
      >
        <div className="text-sm font-semibold" style={{ color: submissionMode === "replacement" ? "#fbbf24" : "var(--accent-text)" }}>
          {submissionMode === "replacement" ? "⚠️ Substituição (requer aprovação)" : questionTitle}
        </div>
        {questionDescription && (
          <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            {questionDescription}
          </div>
        )}
        {currentVersion && !submissionMode && (
          <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Versão atual: v{currentVersion}
          </div>
        )}
        {submissionMode === "replacement" && (
          <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Sua resposta será enviada para revisão. Após aprovação, ela substituirá a resposta atual.
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 rounded-xl px-2 py-1.5"
        style={{ background: "var(--bg-input)", border: "1px solid var(--border-muted)" }}
      >
        <ToolbarGroup>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título">H2</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Subtítulo">H3</ToolbarBtn>
        </ToolbarGroup>
        <ToolbarSep />
        <ToolbarGroup>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito (Ctrl+B)"><b>N</b></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico (Ctrl+I)"><i>I</i></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado (Ctrl+U)"><u>S</u></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Riscado"><s>R</s></ToolbarBtn>
        </ToolbarGroup>
        <ToolbarSep />
        <ToolbarGroup>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista com marcadores">☰</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">1.</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação">❝</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Bloco de código">{"</>"}</ToolbarBtn>
        </ToolbarGroup>
        <ToolbarSep />
        <ToolbarGroup>
          <ToolbarBtn onClick={handleAddLink} active={editor.isActive("link")} title="Inserir link">🔗</ToolbarBtn>
          <ToolbarBtn onClick={() => fileInputRef.current?.click()} active={false} title="Inserir imagem ou arquivo">{uploading ? "⏳" : "📷"}</ToolbarBtn>
        </ToolbarGroup>
        <ToolbarSep />
        <ToolbarGroup>
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Desfazer (Ctrl+Z)">↩</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Refazer (Ctrl+Y)">↪</ToolbarBtn>
        </ToolbarGroup>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.xlsx,.docx,.csv,.txt" onChange={handleFileInput} className="hidden" />

      {/* Editor area */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-muted)", background: "var(--bg-input)", minHeight: "180px" }}>
        <EditorContent editor={editor} />
      </div>

      {uploading && (
        <div className="text-xs animate-fade-in" style={{ color: "var(--accent-text)" }}>⏳ Fazendo upload da imagem...</div>
      )}

      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        💡 Cole imagens diretamente (Ctrl+V) ou arraste para o editor
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={isPending} className={submissionMode === "replacement" ? "baba-button-secondary" : "baba-button-primary"}>
          {saveLabel}
        </button>
        {saved && (
          <span className="text-sm animate-fade-in" style={{ color: "var(--success)" }}>
            ✓ {submissionMode === "replacement" ? "Enviado para aprovação" : "Salvo com sucesso"}
          </span>
        )}
        {error && (
          <span className="text-sm" style={{ color: "var(--danger)" }}>✗ {error}</span>
        )}
      </div>
    </div>
  );
}

// ====== Toolbar Sub-components ======

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-md transition-colors"
      style={{
        width: "30px",
        height: "28px",
        fontSize: "12px",
        fontWeight: active ? 700 : 500,
        background: active ? "var(--accent-subtle)" : "transparent",
        color: active ? "var(--accent-text)" : "var(--text-secondary)",
        border: active ? "1px solid rgba(212,160,23,0.4)" : "1px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "var(--border-muted)",
        margin: "0 2px",
      }}
    />
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}
