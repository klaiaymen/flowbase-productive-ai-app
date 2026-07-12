"use client";

import { Editor } from "@tiptap/react";
import { useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Sparkles,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiBubbleMenuProps {
  editor: Editor;
}

const AI_ACTIONS = [
  { id: "improve-grammar", label: "Improve Grammar", icon: "✏️" },
  { id: "rephrase", label: "Rephrase", icon: "🔄" },
  { id: "make-shorter", label: "Make Shorter", icon: "✂️" },
  { id: "make-longer", label: "Make Longer", icon: "📝" },
  { id: "simplify-language", label: "Simplify Language", icon: "💡" },
  { id: "change-tone", label: "Change Tone", icon: "🎭" },
];

export function AiBubbleMenu({ editor }: AiBubbleMenuProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAiRefine = async (action: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) return;

    setLoading(true);
    setActiveAction(action);
    setAiOpen(false);

    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, action }),
      });
      const data = await res.json();
      if (data.result) {
        editor.chain().focus().deleteSelection().insertContent(data.result).run();
      }
    } catch (e) {
      console.error("AI refine error:", e);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  return (
    <div className="bubble-menu flex items-center gap-0.5 rounded-xl border border-slate-200/80 bg-white px-1.5 py-1 shadow-lg shadow-slate-200/60 backdrop-blur-md">
      {/* Standard formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "flex size-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100",
          editor.isActive("bold") && "bg-slate-800 text-white"
        )}
        title="Bold"
      >
        <Bold className="size-3" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "flex size-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100",
          editor.isActive("italic") && "bg-slate-800 text-white"
        )}
        title="Italic"
      >
        <Italic className="size-3" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          "flex size-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100",
          editor.isActive("strike") && "bg-slate-800 text-white"
        )}
        title="Strikethrough"
      >
        <Strikethrough className="size-3" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(
          "flex size-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100",
          editor.isActive("code") && "bg-slate-800 text-white"
        )}
        title="Code"
      >
        <Code className="size-3" />
      </button>

      {/* Separator */}
      <div className="mx-1 h-4 w-px bg-slate-200" />

      {/* AI Refine */}
      <div className="relative">
        <button
          id="ai-refine-btn"
          onClick={() => setAiOpen((v) => !v)}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          AI Refine
          {!loading && <ChevronDown className="size-2.5" />}
        </button>

        {aiOpen && (
          <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AI Refine
            </div>
            {AI_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAiRefine(action.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
              >
                <span className="text-sm">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
