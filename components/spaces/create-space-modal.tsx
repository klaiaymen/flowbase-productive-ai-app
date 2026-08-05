"use client";

import { useState, useTransition } from "react";
import { X, Folder } from "lucide-react";
import { createSpace } from "@/app/spaces/actions";

const SPACE_COLORS = [
  { id: "violet",  label: "Violet",  bg: "bg-violet-500",  ring: "ring-violet-400",  preview: "from-violet-400 to-violet-600" },
  { id: "sky",     label: "Sky",     bg: "bg-sky-500",     ring: "ring-sky-400",     preview: "from-sky-400 to-sky-600" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", ring: "ring-emerald-400", preview: "from-emerald-400 to-emerald-600" },
  { id: "amber",   label: "Amber",   bg: "bg-amber-500",   ring: "ring-amber-400",   preview: "from-amber-400 to-amber-600" },
  { id: "rose",    label: "Rose",    bg: "bg-rose-500",    ring: "ring-rose-400",    preview: "from-rose-400 to-rose-600" },
  { id: "indigo",  label: "Indigo",  bg: "bg-indigo-500",  ring: "ring-indigo-400",  preview: "from-indigo-400 to-indigo-600" },
  { id: "cyan",    label: "Cyan",    bg: "bg-cyan-500",    ring: "ring-cyan-400",    preview: "from-cyan-400 to-cyan-600" },
  { id: "fuchsia", label: "Fuchsia", bg: "bg-fuchsia-500", ring: "ring-fuchsia-400", preview: "from-fuchsia-400 to-fuchsia-600" },
];

interface Props {
  onClose: () => void;
  onCreated: (space: any) => void;
}

export function CreateSpaceModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("violet");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedColor = SPACE_COLORS.find((c) => c.id === color)!;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Space name is required."); return; }
    setError("");

    startTransition(async () => {
      try {
        const space = await createSpace({ name, description, color });
        onCreated(space);
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to create space.");
      }
    });
  }

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white shadow-[0_32px_80px_rgba(109,40,217,0.18)] animate-in fade-in zoom-in-95 duration-200"
        style={{ animationFillMode: "both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`grid size-10 place-items-center rounded-2xl bg-gradient-to-br ${selectedColor.preview} shadow-lg`}>
              <Folder className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Space</h2>
              <p className="text-xs text-slate-500">Organize pages into a workspace folder</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Space Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700" htmlFor="space-name">
              Space Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="space-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work Projects, Personal, Ideas..."
              maxLength={60}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700" htmlFor="space-desc">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="space-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this space for?"
              maxLength={200}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          {/* Color Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700">Color</label>
            <div className="flex flex-wrap gap-2">
              {SPACE_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.id)}
                  className={`size-7 rounded-full ${c.bg} transition-all duration-150 ${
                    color === c.id
                      ? `ring-2 ring-offset-2 ${c.ring} scale-110`
                      : "hover:scale-105 opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}

          {/* Actions */}
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
              disabled={isPending || !name.trim()}
              className={`h-9 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all duration-150 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPending ? "Creating…" : "Create Space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
