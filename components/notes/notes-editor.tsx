"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { Note } from "@/db/schema";
import { updateNote } from "@/app/notes/actions";
import { EditorToolbar } from "./editor-toolbar";
import { SlashCommandMenu } from "./slash-command-menu";
import { AiBubbleMenu } from "./bubble-menu-ai";
import type { Editor } from "@tiptap/react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
} from "lucide-react";

interface NotesEditorProps {
  note: Note | null;
  onNoteUpdate: (updated: Note) => void;
}

type SaveStatus = "idle" | "saving" | "saved";

// ─── Custom Bubble Menu ───────────────────────────────────────────────────────
// Tiptap v3 removed the React <BubbleMenu> component from @tiptap/react.
// We implement our own using a portal + selection tracking.

interface CustomBubbleMenuProps {
  editor: Editor;
  children: React.ReactNode;
}

function CustomBubbleMenu({ editor, children }: CustomBubbleMenuProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { from, to, empty } = editor.state.selection;

      if (empty) {
        setVisible(false);
        return;
      }

      // Get bounding rect of the selection
      const view = editor.view;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      // Use mid-point of selection for horizontal centering
      const left = (start.left + end.left) / 2;
      const top = Math.min(start.top, end.top);

      setCoords({ top, left });
      setVisible(true);
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!visible || typeof window === "undefined") return null;

  const menuWidth = 320; // approx width of bubble menu
  const offset = 8; // px above selection

  // Calculate position relative to viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: coords.top - offset,
    left: coords.left,
    transform: "translate(-50%, -100%)",
    zIndex: 9999,
  };

  return createPortal(
    <div
      ref={menuRef}
      style={style}
      className="animate-in fade-in slide-in-from-bottom-1 duration-150"
    >
      {children}
    </div>,
    document.body
  );
}

// ─── Main Editor Component ────────────────────────────────────────────────────

export function NotesEditor({ note, onNoteUpdate }: NotesEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [title, setTitle] = useState(note?.title ?? "");
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync title when note changes
  useEffect(() => {
    setTitle(note?.title ?? "");
  }, [note?.id]);

  const save = useCallback(
    async (titleVal: string, contentHtml: string) => {
      if (!note) return;
      setSaveStatus("saving");
      try {
        const updated = await updateNote(note.id, {
          title: titleVal,
          content: contentHtml,
        });
        onNoteUpdate({ ...note, ...updated });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [note, onNoteUpdate]
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
          // Link is included in StarterKit v3 — don't add separately
        }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === "heading") return "Heading…";
            return "Press / for commands, or start writing…";
          },
          emptyNodeClass: "is-editor-empty",
        }),
        CharacterCount,
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: note?.content ?? "",
      onUpdate: ({ editor }) => {
        scheduleSave(title, editor.getHTML());
      },
      editorProps: {
        handleKeyDown: (view, event) => {
          if (event.key === "/") {
            const { from } = view.state.selection;
            const coords = view.coordsAtPos(from);
            const editorRect = view.dom.getBoundingClientRect();
            setSlashMenuPos({
              top: coords.bottom - editorRect.top + 4,
              left: coords.left - editorRect.left,
            });
            setSlashMenuOpen(true);
          } else if (event.key === "Escape") {
            setSlashMenuOpen(false);
          } else if (slashMenuOpen) {
            setSlashMenuOpen(false);
          }
          return false;
        },
        attributes: { class: "notes-editor-content" },
      },
    },
    [note?.id]
  );

  // Reset content when note changes (guard against destroyed editor during teardown)
  useEffect(() => {
    if (editor && !editor.isDestroyed && note) {
      try {
        if (editor.getHTML() !== note.content) {
          editor.commands.setContent(note.content ?? "", false);
        }
      } catch {
        // editor may be mid-teardown; ignore
      }
    }
  }, [note?.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(val, editor?.getHTML() ?? "");
  };

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  if (!note) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br from-white/60 to-rose-50/40">
        <div className="grid size-16 place-items-center rounded-3xl bg-rose-100/60 shadow-sm">
          <FileText className="size-7 text-rose-300" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-slate-500">No note selected</p>
          <p className="mt-1 text-[12px] text-slate-400">
            Select a note from the left, or create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-white/80 to-rose-50/20">
      {/* Toolbar */}
      {editor && <EditorToolbar editor={editor} />}

      {/* Bubble menu – rendered into document.body via portal */}
      {editor && (
        <CustomBubbleMenu editor={editor}>
          <AiBubbleMenu editor={editor} />
        </CustomBubbleMenu>
      )}

      {/* Editor area */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-6">
          {/* Title */}
          <input
            ref={titleRef}
            id="note-title-input"
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editor?.commands.focus("start");
              }
            }}
            placeholder="Untitled"
            className="w-full bg-transparent text-[28px] font-bold text-slate-900 outline-none placeholder-slate-300 mb-2"
          />
          <div className="mb-4 h-px bg-gradient-to-r from-rose-100 via-slate-200/40 to-transparent" />

          {/* Tiptap editor */}
          <div className="relative">
            <EditorContent editor={editor} />
            {slashMenuOpen && editor && (
              <SlashCommandMenu
                editor={editor}
                position={slashMenuPos}
                onClose={() => setSlashMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div className="flex items-center justify-between border-t border-slate-100/80 bg-white/60 px-8 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{wordCount} words</span>
          <span className="text-slate-200">·</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-1.5">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="size-3 animate-spin text-slate-400" />
              <span className="text-[11px] text-slate-400">Saving…</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span className="text-[11px] text-emerald-600 font-medium">Saved</span>
            </>
          )}
          {saveStatus === "idle" && (
            <>
              <Clock className="size-3 text-slate-300" />
              <span className="text-[11px] text-slate-300">Auto-save on</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
