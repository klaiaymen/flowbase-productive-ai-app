"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Mark, mergeAttributes } from "@tiptap/core";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { Note } from "@/db/schema";
import { updateNote } from "@/app/notes/actions";
import { EditorToolbar } from "./editor-toolbar";
import { SlashCommandMenu } from "./slash-command-menu";
import { AiBubbleMenu } from "./bubble-menu-ai";
import type { Editor } from "@tiptap/react";
import { useAssemblyAlStreaming } from "@/hooks/use-assemblyai-streaming";
import {
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  Mic,
  Square,
} from "lucide-react";

interface NotesEditorProps {
  note: Note | null;
  onNoteUpdate: (updated: Note) => void;
}

type SaveStatus = "idle" | "saving" | "saved";

// ─── Voice Input Extensions & Helpers ─────────────────────────────────────────

// Tiptap custom mark to style real-time partial transcription
const VoicePartialMark = Mark.create({
  name: "voicePartial",

  parseHTML() {
    return [
      {
        tag: "span.voice-partial",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "voice-partial" }), 0];
  },
});

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

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "error" | "info" } | null>(null);
  
  // Audio session time tracking (2 minutes max)
  const [elapsed, setElapsed] = useState(0);

  // Position tracking for real-time speech insertion
  const partialAnchorRef = useRef<number | null>(null);
  const partialLenRef = useRef<number>(0);
  const lastSelectionRef = useRef<number | null>(null);
  const applyingPartialRef = useRef(false);

  // Sync title when note changes
  useEffect(() => {
    setTitle(note?.title ?? "");
    // Stop any active recording session if active note changes
    if (isRecording) {
      handleStop();
    }
  }, [note?.id]);

  const showToast = (message: string, type: "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

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
        VoicePartialMark,
      ],
      content: note?.content ?? "",
      onUpdate: ({ editor }) => {
        if (applyingPartialRef.current) return;
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
          editor.commands.setContent(note.content ?? "", { emitUpdate: false });
        }
        lastSelectionRef.current = null;
        partialAnchorRef.current = null;
        partialLenRef.current = 0;
      } catch {
        // editor may be mid-teardown; ignore
      }
    }
  }, [note?.id]);

  useEffect(() => {
    if (!editor) return;

    const updateLastSelection = () => {
      if (!editor.isDestroyed && editor.isFocused) {
        lastSelectionRef.current = editor.state.selection.from;
      }
    };

    editor.on("selectionUpdate", updateLastSelection);
    editor.on("focus", updateLastSelection);

    return () => {
      editor.off("selectionUpdate", updateLastSelection);
      editor.off("focus", updateLastSelection);
    };
  }, [editor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(val, editor?.getHTML() ?? "");
  };

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  // ─── Voice Recognition Handlers ────────────────────────────────────────────

  const getVoiceInsertPosition = useCallback(() => {
    if (!editor || editor.isDestroyed) return 0;

    const docEnd = editor.state.doc.content.size;
    const currentSelection = editor.isFocused ? editor.state.selection.from : lastSelectionRef.current;

    if (typeof currentSelection === "number") {
      return Math.max(0, Math.min(currentSelection, docEnd));
    }

    return docEnd;
  }, [editor]);

  const handlePartialTranscript = useCallback((text: string) => {
    if (!editor || editor.isDestroyed) return;

    if (partialAnchorRef.current === null) {
      partialAnchorRef.current = getVoiceInsertPosition();
    }

    const start = partialAnchorRef.current;
    const end = start + partialLenRef.current;

    try {
      applyingPartialRef.current = true;
      const chain = editor.chain().focus().deleteRange({ from: start, to: end });

      if (text) {
        chain
          .insertContentAt(start, {
            type: "text",
            text,
            marks: [{ type: "voicePartial" }],
          })
          .setTextSelection(start + text.length)
          .run();
      } else {
        chain.setTextSelection(start).run();
      }
    } finally {
      applyingPartialRef.current = false;
    }

    partialLenRef.current = text.length;
  }, [editor, getVoiceInsertPosition]);

  const handleFinalTranscript = useCallback((text: string) => {
    if (!editor || editor.isDestroyed || !text.trim()) return;

    if (partialAnchorRef.current === null) {
      partialAnchorRef.current = getVoiceInsertPosition();
    }

    const start = partialAnchorRef.current;
    const end = start + partialLenRef.current;
    const finalText = text + " ";

    editor.chain()
      .focus()
      .deleteRange({ from: start, to: end })
      .insertContentAt(start, {
        type: "text",
        text: finalText
      })
      .setTextSelection(start + finalText.length)
      .run();

    partialAnchorRef.current = start + finalText.length;
    partialLenRef.current = 0;
    lastSelectionRef.current = partialAnchorRef.current;

    // Trigger auto-save immediately
    scheduleSave(title, editor.getHTML());
  }, [editor, title, scheduleSave, getVoiceInsertPosition]);

  const handleSessionEnd = useCallback(() => {
    showToast("Recording reached 2 minute limit.", "info");
    
    // Clean up any remaining partial text by finalizing it (removing styling)
    if (editor && !editor.isDestroyed && partialAnchorRef.current !== null && partialLenRef.current > 0) {
      const start = partialAnchorRef.current;
      const end = start + partialLenRef.current;

      editor.chain()
        .focus()
        .setTextSelection({ from: start, to: end })
        .unsetMark("voicePartial")
        .setTextSelection(end)
        .run();

      partialAnchorRef.current = end;
      partialLenRef.current = 0;
      lastSelectionRef.current = end;
      scheduleSave(title, editor.getHTML());
    }
  }, [editor, title, scheduleSave]);

  const handleVoiceError = useCallback((errorMsg: string) => {
    showToast(errorMsg, "error");
  }, []);

  const { isRecording, startRecording, stopRecording } = useAssemblyAlStreaming({
    onPartialTranscript: handlePartialTranscript,
    onFinalTranscript: handleFinalTranscript,
    onSessionEnd: handleSessionEnd,
    onError: handleVoiceError,
  });

  // Track recording elapsed time
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      setElapsed(0);
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleStart = () => {
    if (!editor || editor.isDestroyed) return;
    
    const insertAt = getVoiceInsertPosition();
    editor.chain().focus().setTextSelection(insertAt).run();
    partialAnchorRef.current = insertAt;
    partialLenRef.current = 0;
    lastSelectionRef.current = insertAt;
    
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
    
    // Clean up any active partial text mark to finalize it
    if (editor && !editor.isDestroyed && partialAnchorRef.current !== null && partialLenRef.current > 0) {
      const start = partialAnchorRef.current;
      const end = start + partialLenRef.current;

      editor.chain()
        .focus()
        .setTextSelection({ from: start, to: end })
        .unsetMark("voicePartial")
        .setTextSelection(end)
        .run();

      partialAnchorRef.current = end;
      partialLenRef.current = 0;
      lastSelectionRef.current = end;
      scheduleSave(title, editor.getHTML());
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const voiceControl = (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <div className="flex items-center gap-2.5 rounded-full bg-rose-50 px-3 py-1.5 border border-rose-100/80 shadow-sm animate-in fade-in zoom-in-95 duration-150">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-rose-600 font-mono">
            {formatTime(elapsed)} / 2:00
          </span>
          <div className="h-3 w-px bg-rose-200" />
          <button
            onClick={handleStop}
            className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-rose-600 hover:text-rose-800 transition active:scale-95"
            title="Stop Recording"
          >
            <Square className="size-3 fill-rose-600 text-rose-600" />
            Stop
          </button>
        </div>
      ) : (
        <button
          onClick={handleStart}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
        >
          <Mic className="size-3.5 text-slate-500" />
          Speak to Note
        </button>
      )}
    </div>
  );

  // ─── Rendering ──────────────────────────────────────────────────────────────

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
      {/* Toolbar with voice controls */}
      {editor && <EditorToolbar editor={editor} voiceControl={voiceControl} />}

      {/* Toast Notification Container */}
      {toast && (
        <div className="absolute bottom-16 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className={cn(
            "rounded-xl px-4 py-2.5 text-[12px] font-semibold shadow-lg backdrop-blur-md flex items-center gap-2",
            toast.type === "error" 
              ? "bg-rose-50 border border-rose-200 text-rose-600" 
              : "bg-slate-900/90 text-white"
          )}>
            {toast.message}
          </div>
        </div>
      )}

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
