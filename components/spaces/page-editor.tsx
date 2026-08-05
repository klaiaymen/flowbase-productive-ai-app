"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Clock, Loader2, FileText, Folder, Star, Download,
} from "lucide-react";
import { updatePage, togglePageFavorite } from "@/app/spaces/actions";
import { EditorToolbar } from "@/components/notes/editor-toolbar";
import type { PagePreviewData } from "./page-preview-panel";
import { SPACE_COLOR_MAP } from "./space-card";

interface Props {
  page: PagePreviewData;
  spaceName: string;
  spaceColor: string;
  onBack: () => void;
  onUpdated: (updated: PagePreviewData) => void;
}

type SaveStatus = "idle" | "saving" | "saved";

export function PageEditor({ page, spaceName, spaceColor, onBack, onUpdated }: Props) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [title, setTitle] = useState(page.name);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = SPACE_COLOR_MAP[spaceColor] ?? SPACE_COLOR_MAP.violet;

  // Sync title if page changes externally
  useEffect(() => {
    setTitle(page.name);
  }, [page.id, page.name]);

  const save = useCallback(
    async (titleVal: string, contentHtml: string) => {
      setSaveStatus("saving");
      try {
        const updated = await updatePage(page.id, {
          name: titleVal,
          content: contentHtml,
        });
        if (updated) {
          onUpdated({
            ...page,
            name: updated.name,
            updatedAt: updated.updatedAt,
          });
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [page, onUpdated]
  );

  const scheduleSave = useCallback(
    (titleVal: string, contentHtml: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus("saving");
      saveTimer.current = setTimeout(() => {
        save(titleVal, contentHtml);
      }, 800);
    },
    [save]
  );

  const editor = useEditor(
    {
      immediatelyRender: true,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: { languageClassPrefix: "language-" },
        }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === "heading") return "Heading…";
            return "Start writing page content, or insert notes, tasks, and ideas…";
          },
          emptyNodeClass: "is-editor-empty",
        }),
        CharacterCount,
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: (page as any).content || `<h1>${page.name}</h1><p></p>`,
      onUpdate: ({ editor }) => {
        scheduleSave(title, editor.getHTML());
      },
      editorProps: {
        attributes: { class: "page-editor-content" },
      },
    },
    [page.id]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(val, editor?.getHTML() ?? "");
  };

  function handleFavorite() {
    togglePageFavorite(page.id, page.isFavorited).then((updated) => {
      if (updated) {
        onUpdated({ ...page, isFavorited: updated.isFavorited });
      }
    });
  }

  function handleExportMarkdown() {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    // Simple HTML-to-text / markdown formatting export
    const container = document.createElement("div");
    container.innerHTML = htmlContent;
    const textContent = container.innerText || container.textContent || "";
    
    const blob = new Blob([`# ${title}\n\n${textContent}`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  return (
    <div className="flex flex-col h-full rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-violet-600 transition-all shadow-sm"
          >
            <ArrowLeft className="size-3.5" />
            Back to Space
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 min-w-0">
            <div className={`grid size-6 place-items-center rounded-lg bg-gradient-to-br ${colors.gradient} shadow-sm shrink-0`}>
              <Folder className="size-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500 truncate">{spaceName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite toggle */}
          <button
            type="button"
            onClick={handleFavorite}
            className={`flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
              page.isFavorited ? "text-amber-500 border-amber-200 bg-amber-50" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Star className={`size-3.5 ${page.isFavorited ? "fill-amber-400" : ""}`} />
            {page.isFavorited ? "Favorited" : "Favorite"}
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            title="Export as Markdown"
          >
            <Download className="size-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* ── Editor Formatting Toolbar ── */}
      {editor && <EditorToolbar editor={editor} />}

      {/* ── Main Editor Body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-3xl">
          {/* Editable Title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Page Title…"
            className="w-full bg-transparent text-3xl font-extrabold text-slate-900 outline-none placeholder:text-slate-300 mb-2"
          />
          <div className="mb-6 h-px bg-gradient-to-r from-violet-200 via-slate-200/50 to-transparent" />

          {/* Editor content */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Footer Status Bar ── */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-2.5">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{wordCount} words</span>
          <span className="text-slate-200">·</span>
          <span>{charCount} characters</span>
        </div>

        <div className="flex items-center gap-1.5">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="size-3.5 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Saving…</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Saved</span>
            </>
          )}
          {saveStatus === "idle" && (
            <>
              <Clock className="size-3.5 text-slate-300" />
              <span className="text-xs text-slate-400">Auto-save on</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
