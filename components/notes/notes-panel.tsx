"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Star,
  Trash2,
  MoreHorizontal,
  Pin,
  Copy,
  Pencil,
  Palette,
  RotateCcw,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/db/schema";
import {
  trashNote,
  restoreNote,
  permanentlyDeleteNote,
  duplicateNote,
  updateNote,
} from "@/app/notes/actions";

const NOTE_COLORS: { value: string; label: string; bg: string; border: string; dot: string }[] = [
  { value: "rose", label: "Rose", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-400" },
  { value: "violet", label: "Violet", bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-400" },
  { value: "amber", label: "Amber", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400" },
  { value: "sky", label: "Sky", bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-400" },
  { value: "emerald", label: "Emerald", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400" },
  { value: "slate", label: "Slate", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
];

const COLOR_LEFT_BORDER: Record<string, string> = {
  rose: "border-l-rose-400",
  violet: "border-l-violet-400",
  amber: "border-l-amber-400",
  sky: "border-l-sky-400",
  emerald: "border-l-emerald-400",
  slate: "border-l-slate-400",
};

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NotesPanelProps {
  notes: Note[];
  selectedId: number | null;
  onSelect: (note: Note) => void;
  onNewNote: () => void;
  onNotesChange: (notes: Note[]) => void;
}

export function NotesPanel({ notes, selectedId, onSelect, onNewNote, onNotesChange }: NotesPanelProps) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
        setColorPickerOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (renaming && renameRef.current) renameRef.current.focus();
  }, [renaming]);

  const activeNotes = notes.filter((n) => !n.isTrashed);
  const trashedNotes = notes.filter((n) => n.isTrashed);

  const filtered = activeNotes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);
  const sorted = [...pinned, ...unpinned];

  const handleRename = useCallback(
    async (id: number) => {
      if (!renameValue.trim()) return;
      const updated = await updateNote(id, { title: renameValue.trim() });
      onNotesChange(notes.map((n) => (n.id === id ? { ...n, ...updated } : n)));
      setRenaming(null);
    },
    [renameValue, notes, onNotesChange]
  );

  const handlePin = useCallback(
    async (note: Note) => {
      const updated = await updateNote(note.id, { isPinned: !note.isPinned });
      onNotesChange(notes.map((n) => (n.id === note.id ? { ...n, ...updated } : n)));
      setMenuOpen(null);
    },
    [notes, onNotesChange]
  );

  const handleColor = useCallback(
    async (note: Note, color: string) => {
      const updated = await updateNote(note.id, { color });
      onNotesChange(notes.map((n) => (n.id === note.id ? { ...n, ...updated } : n)));
      setColorPickerOpen(null);
      setMenuOpen(null);
    },
    [notes, onNotesChange]
  );

  const handleDuplicate = useCallback(
    async (note: Note) => {
      const duped = await duplicateNote(note.id);
      onNotesChange([duped, ...notes]);
      setMenuOpen(null);
    },
    [notes, onNotesChange]
  );

  const handleTrash = useCallback(
    async (note: Note) => {
      await trashNote(note.id);
      const updated = notes.map((n) => (n.id === note.id ? { ...n, isTrashed: true } : n));
      onNotesChange(updated);
      setMenuOpen(null);
    },
    [notes, onNotesChange]
  );

  const handleRestore = useCallback(
    async (note: Note) => {
      await restoreNote(note.id);
      onNotesChange(notes.map((n) => (n.id === note.id ? { ...n, isTrashed: false } : n)));
    },
    [notes, onNotesChange]
  );

  const handlePermanentDelete = useCallback(
    async (note: Note) => {
      await permanentlyDeleteNote(note.id);
      onNotesChange(notes.filter((n) => n.id !== note.id));
    },
    [notes, onNotesChange]
  );

  return (
    <aside className="notes-panel flex h-full flex-col border-r border-white/80 bg-white/70 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-rose-100">
            <FileText className="size-3.5 text-rose-500" />
          </span>
          <span className="text-[13px] font-bold text-slate-900">Notes</span>
        </div>
        <button
          id="new-note-btn"
          onClick={onNewNote}
          className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-rose-600 active:scale-95"
        >
          <Plus className="size-3" />
          New Note
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2">
          <Search className="size-3.5 shrink-0 text-slate-400" />
          <input
            id="notes-search"
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[12px] text-slate-700 placeholder-slate-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="size-3 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2" ref={menuRef}>
        {sorted.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <div className="grid size-10 place-items-center rounded-2xl bg-rose-50">
              <FileText className="size-5 text-rose-300" />
            </div>
            <p className="text-[12px] font-medium text-slate-400">
              {search ? "No notes match your search" : "No notes yet. Create one!"}
            </p>
          </div>
        )}

        {sorted.map((note) => {
          const isSelected = note.id === selectedId;
          const isMenuOpen = menuOpen === note.id;
          const isColorOpen = colorPickerOpen === note.id;
          const leftBorder = COLOR_LEFT_BORDER[note.color] ?? "border-l-rose-400";

          return (
            <div key={note.id} className="relative mb-1">
              {renaming === note.id ? (
                <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2">
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(note.id);
                      if (e.key === "Escape") setRenaming(null);
                    }}
                    onBlur={() => handleRename(note.id)}
                    className="flex-1 bg-transparent text-[12px] font-semibold text-slate-900 outline-none"
                  />
                </div>
              ) : (
                <div
                  id={`note-item-${note.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(note)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(note); }}
                  className={cn(
                    "group w-full cursor-pointer rounded-xl border-l-[3px] bg-white/80 px-3 py-2.5 text-left shadow-sm transition-all hover:shadow-md hover:bg-white",
                    leftBorder,
                    isSelected && "ring-2 ring-rose-200 bg-white shadow-md"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {note.isPinned && (
                          <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                        )}
                        <p className="truncate text-[12px] font-semibold text-slate-900">
                          {note.title || "Untitled"}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatRelativeTime(note.updatedAt)}
                      </p>
                    </div>
                    <button
                      id={`note-menu-${note.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(isMenuOpen ? null : note.id);
                        setColorPickerOpen(null);
                      }}
                      className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Context Menu */}
              {isMenuOpen && (
                <div className="absolute right-1 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl">
                  <button
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenaming(note.id);
                      setRenameValue(note.title);
                      setMenuOpen(null);
                    }}
                  >
                    <Pencil className="size-3.5 text-slate-400" /> Rename
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                    onClick={(e) => { e.stopPropagation(); handlePin(note); }}
                  >
                    <Pin className="size-3.5 text-slate-400" />
                    {note.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                    onClick={(e) => { e.stopPropagation(); setColorPickerOpen(note.id); }}
                  >
                    <Palette className="size-3.5 text-slate-400" /> Color
                  </button>
                  {isColorOpen && (
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          title={c.label}
                          onClick={(e) => { e.stopPropagation(); handleColor(note, c.value); }}
                          className={cn(
                            "size-5 rounded-full transition hover:scale-110",
                            c.dot,
                            note.color === c.value && "ring-2 ring-offset-1 ring-slate-400"
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <button
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(note); }}
                  >
                    <Copy className="size-3.5 text-slate-400" /> Duplicate
                  </button>
                  <div className="mx-2 my-1 h-px bg-slate-100" />
                  <button
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-rose-600 hover:bg-rose-50"
                    onClick={(e) => { e.stopPropagation(); handleTrash(note); }}
                  >
                    <Trash2 className="size-3.5" /> Move to Trash
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trash section */}
      <div className="border-t border-slate-100 px-2 py-2">
        <button
          id="trash-toggle-btn"
          onClick={() => setTrashOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Trash2 className="size-3.5 text-slate-400" />
          <span className="flex-1 text-left">Trash</span>
          {trashedNotes.length > 0 && (
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
              {trashedNotes.length}
            </span>
          )}
          {trashOpen ? (
            <ChevronDown className="size-3 text-slate-400" />
          ) : (
            <ChevronRight className="size-3 text-slate-400" />
          )}
        </button>

        {trashOpen && (
          <div className="mt-1 space-y-1">
            {trashedNotes.length === 0 && (
              <p className="px-2 py-1 text-[11px] text-slate-400">Trash is empty</p>
            )}
            {trashedNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-slate-50"
              >
                <p className="flex-1 truncate text-[11px] text-slate-500">{note.title || "Untitled"}</p>
                <button
                  title="Restore"
                  onClick={() => handleRestore(note)}
                  className="rounded p-0.5 text-slate-400 hover:text-emerald-600"
                >
                  <RotateCcw className="size-3" />
                </button>
                <button
                  title="Delete permanently"
                  onClick={() => handlePermanentDelete(note)}
                  className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
