"use client";

import { useState, useCallback, useEffect } from "react";
import type { Note } from "@/db/schema";
import { getNotes, createNote } from "@/app/notes/actions";
import { NotesPanel } from "@/components/notes/notes-panel";
import { NotesEditor } from "@/components/notes/notes-editor";
import { AppShell } from "@/components/app-shell";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotes().then((data) => {
      setNotes(data);
      const first = data.find((n) => !n.isTrashed);
      if (first) setSelectedId(first.id);
      setLoading(false);
    });
  }, []);

  const handleNewNote = useCallback(async () => {
    const note = await createNote();
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
  }, []);

  const handleSelect = useCallback((note: Note) => {
    setSelectedId(note.id);
  }, []);

  const handleNoteUpdate = useCallback((updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-rose-200 border-t-rose-500" />
            <p className="text-[13px] text-slate-400">Loading notes…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell noPadding>
      <div className="flex h-screen overflow-hidden">
        {/* Left Notes Panel */}
        <div className="w-[260px] shrink-0 h-full">
          <NotesPanel
            notes={notes}
            selectedId={selectedId}
            onSelect={handleSelect}
            onNewNote={handleNewNote}
            onNotesChange={setNotes}
          />
        </div>
        {/* Right Editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <NotesEditor note={selectedNote} onNoteUpdate={handleNoteUpdate} />
        </div>
      </div>
    </AppShell>
  );
}
