"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Star, MoreHorizontal, Folder, Clock, FileText,
  Edit3, Palette, Plus, UserPlus, Copy, Archive, Trash2, ArchiveRestore,
} from "lucide-react";
import {
  toggleSpaceFavorite, archiveSpace, unarchiveSpace,
  deleteSpace, duplicateSpace,
} from "@/app/spaces/actions";

export const SPACE_COLOR_MAP: Record<string, { icon: string; ring: string; light: string; gradient: string; text: string }> = {
  violet:  { icon: "bg-violet-500",  ring: "ring-violet-200",  light: "bg-violet-50",  gradient: "from-violet-400 to-violet-600",  text: "text-violet-600"  },
  sky:     { icon: "bg-sky-500",     ring: "ring-sky-200",     light: "bg-sky-50",     gradient: "from-sky-400 to-sky-600",       text: "text-sky-600"     },
  emerald: { icon: "bg-emerald-500", ring: "ring-emerald-200", light: "bg-emerald-50", gradient: "from-emerald-400 to-emerald-600", text: "text-emerald-600" },
  amber:   { icon: "bg-amber-500",   ring: "ring-amber-200",   light: "bg-amber-50",   gradient: "from-amber-400 to-amber-600",   text: "text-amber-600"   },
  rose:    { icon: "bg-rose-500",    ring: "ring-rose-200",    light: "bg-rose-50",    gradient: "from-rose-400 to-rose-600",     text: "text-rose-600"    },
  indigo:  { icon: "bg-indigo-500",  ring: "ring-indigo-200",  light: "bg-indigo-50",  gradient: "from-indigo-400 to-indigo-600", text: "text-indigo-600"  },
  cyan:    { icon: "bg-cyan-500",    ring: "ring-cyan-200",    light: "bg-cyan-50",    gradient: "from-cyan-400 to-cyan-600",     text: "text-cyan-600"    },
  fuchsia: { icon: "bg-fuchsia-500", ring: "ring-fuchsia-200", light: "bg-fuchsia-50", gradient: "from-fuchsia-400 to-fuchsia-600", text: "text-fuchsia-600" },
};

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 2) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return "last week";
}

export interface SpaceCardData {
  id: number;
  name: string;
  description: string | null;
  color: string;
  isFavorited: boolean;
  isArchived: boolean;
  pageCount: number;
  memberEmails: string[];
  updatedAt: Date | string;
}

interface Props {
  space: SpaceCardData;
  onOpen: (space: SpaceCardData) => void;
  onRename: (space: SpaceCardData) => void;
  onChangeColor: (space: SpaceCardData) => void;
  onAddPage: (space: SpaceCardData) => void;
  onInvite: (space: SpaceCardData) => void;
  onUpdated: (updated: SpaceCardData) => void;
  onDeleted: (id: number) => void;
}

export function SpaceCard({
  space, onOpen, onRename, onChangeColor, onAddPage, onInvite, onUpdated, onDeleted,
}: Props) {
  const colors = SPACE_COLOR_MAP[space.color] ?? SPACE_COLOR_MAP.violet;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const updated = await toggleSpaceFavorite(space.id, space.isFavorited);
      if (updated) onUpdated({ ...space, isFavorited: updated.isFavorited });
    });
  }

  function handleArchive() {
    setMenuOpen(false);
    startTransition(async () => {
      if (space.isArchived) {
        const updated = await unarchiveSpace(space.id);
        if (updated) onUpdated({ ...space, isArchived: false });
      } else {
        const updated = await archiveSpace(space.id);
        if (updated) onUpdated({ ...space, isArchived: true });
      }
    });
  }

  function handleDuplicate() {
    setMenuOpen(false);
    startTransition(async () => {
      const newSpace = await duplicateSpace(space.id);
      if (newSpace) {
        onUpdated({
          id: newSpace.id, name: newSpace.name, description: newSpace.description,
          color: newSpace.color, isFavorited: false, isArchived: false,
          pageCount: 0, memberEmails: [], updatedAt: newSpace.updatedAt,
        });
      }
    });
  }

  function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Delete "${space.name}" and all its pages? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteSpace(space.id);
      onDeleted(space.id);
    });
  }

  const menuItems = [
    { icon: Edit3,       label: "Rename",                action: () => { setMenuOpen(false); onRename(space); } },
    { icon: Palette,     label: "Change Color",          action: () => { setMenuOpen(false); onChangeColor(space); } },
    { icon: Plus,        label: "Add Page",              action: () => { setMenuOpen(false); onAddPage(space); } },
    { icon: UserPlus,    label: "Invite Collaborators",  action: () => { setMenuOpen(false); onInvite(space); } },
    { icon: Copy,        label: "Duplicate",             action: handleDuplicate },
    { icon: space.isArchived ? ArchiveRestore : Archive, label: space.isArchived ? "Unarchive" : "Archive", action: handleArchive },
    { icon: Trash2,      label: "Delete",                action: handleDelete, danger: true },
  ];

  return (
    <div
      className={`group relative flex flex-col rounded-3xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${
        space.isArchived ? "opacity-60" : ""
      } ${isPending ? "opacity-60 pointer-events-none" : ""}`}
      style={{ borderColor: "rgba(226,232,240,0.8)" }}
      onClick={() => onOpen(space)}
    >
      {/* Top row: icon + favorite + more */}
      <div className="flex items-start justify-between mb-3">
        <div className={`grid size-11 place-items-center rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-md`}>
          <Folder className="size-5 text-white" />
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Favorite */}
          <button
            type="button"
            onClick={handleFavorite}
            className={`grid size-7 place-items-center rounded-lg transition-colors ${
              space.isFavorited
                ? "text-amber-400"
                : "text-slate-300 hover:text-amber-400"
            }`}
            title={space.isFavorited ? "Unfavorite" : "Favorite"}
          >
            <Star className={`size-4 ${space.isFavorited ? "fill-amber-400" : ""}`} />
          </button>

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid size-7 place-items-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-52 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-150">
                {menuItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={item.action}
                      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors ${
                        (item as any).danger
                          ? "text-rose-500 hover:bg-rose-50"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Space name + description */}
      <h3 className="font-bold text-slate-900 leading-tight mb-0.5 truncate">{space.name}</h3>
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
        {space.description || "No description yet."}
      </p>

      {/* Member avatars */}
      {space.memberEmails.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          {space.memberEmails.slice(0, 4).map((email, i) => (
            <div
              key={i}
              title={email}
              className={`grid size-6 place-items-center rounded-full ${colors.light} ${colors.text} text-[9px] font-bold border-2 border-white -ml-1 first:ml-0 shadow-sm`}
            >
              {email[0].toUpperCase()}
            </div>
          ))}
          {space.memberEmails.length > 4 && (
            <div className="grid size-6 place-items-center rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold border-2 border-white -ml-1 shadow-sm">
              +{space.memberEmails.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Footer: page count + updated */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <FileText className={`size-3.5 ${colors.text}`} />
          <span className="font-semibold text-slate-700">{space.pageCount}</span>
          <span>{space.pageCount === 1 ? "Page" : "Pages"}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="size-3" />
          {formatRelativeTime(space.updatedAt)}
        </div>
      </div>

      {/* Archived badge */}
      {space.isArchived && (
        <div className="absolute top-3 left-3 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          Archived
        </div>
      )}
    </div>
  );
}
