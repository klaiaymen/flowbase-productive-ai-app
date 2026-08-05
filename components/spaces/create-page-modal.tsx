"use client";

import { useState, useTransition } from "react";
import { X, FileText } from "lucide-react";
import { createPage } from "@/app/spaces/actions";

const TEMPLATES = [
  { id: "blank",          label: "Blank Page",      icon: "📄" },
  { id: "project-plan",   label: "Project Plan",    icon: "📋" },
  { id: "meeting-notes",  label: "Meeting Notes",   icon: "📝" },
  { id: "prd",            label: "PRD",             icon: "📐" },
  { id: "research-notes", label: "Research Notes",  icon: "🔬" },
  { id: "task-plan",      label: "Task Plan",       icon: "✅" },
];

interface Space {
  id: number;
  name: string;
  color: string;
}

interface Props {
  spaces: Space[];
  defaultSpaceId?: number;
  onClose: () => void;
  onCreated: (page: any) => void;
}

export function CreatePageModal({ spaces, defaultSpaceId, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [spaceId, setSpaceId] = useState<number>(defaultSpaceId ?? (spaces[0]?.id ?? 0));
  const [template, setTemplate] = useState("blank");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Page name is required."); return; }
    if (!spaceId) { setError("Please select a space."); return; }
    setError("");

    startTransition(async () => {
      try {
        const page = await createPage({ spaceId, name, template });
        onCreated(page);
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to create page.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white shadow-[0_32px_80px_rgba(109,40,217,0.15)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 shadow-lg">
              <FileText className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Page</h2>
              <p className="text-xs text-slate-500">Add a document to a space</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Page Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700" htmlFor="page-name">
              Page Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="page-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 Roadmap, Sprint Planning..."
              maxLength={80}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          {/* Add to Space */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700" htmlFor="page-space">
              Add to Space <span className="text-rose-500">*</span>
            </label>
            <select
              id="page-space"
              value={spaceId}
              onChange={(e) => setSpaceId(Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all appearance-none cursor-pointer"
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Template */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150 ${
                    template === t.id
                      ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span className="text-base leading-none">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim() || !spaceId}
              className="h-9 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all duration-150 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating…" : "Create Page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
