"use client";

import { useState, useTransition } from "react";
import {
  X, Star, Edit3, Move, Copy, Share2, Download, Archive, Trash2,
  MessageSquare, Link2, Clock, FileText, Folder, Check, ExternalLink
} from "lucide-react";
import {
  togglePageFavorite, archivePage, duplicatePage, deletePage,
} from "@/app/spaces/actions";
import { SPACE_COLOR_MAP } from "./space-card";

const TEMPLATE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  "blank":          { label: "Page",           icon: "📄", color: "bg-slate-100 text-slate-600"   },
  "project-plan":   { label: "Project Plan",   icon: "📋", color: "bg-sky-100 text-sky-700"       },
  "meeting-notes":  { label: "Meeting Notes",  icon: "📝", color: "bg-violet-100 text-violet-700" },
  "prd":            { label: "Document",       icon: "📐", color: "bg-indigo-100 text-indigo-700" },
  "research-notes": { label: "Research Notes", icon: "🔬", color: "bg-emerald-100 text-emerald-700" },
  "task-plan":      { label: "Task Plan",      icon: "✅", color: "bg-amber-100 text-amber-700"   },
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

export interface PagePreviewData {
  id: number;
  spaceId: number;
  name: string;
  description: string | null;
  template: string;
  isFavorited: boolean;
  commentsCount: number;
  linkedTaskIds: string | null;
  updatedAt: Date | string;
  clerkUserId: string;
}

interface Props {
  page: PagePreviewData;
  spaceName: string;
  spaceColor: string;
  onClose: () => void;
  onOpenPage?: (page: PagePreviewData) => void;
  onOpenComments?: (page: PagePreviewData) => void;
  onUpdated: (page: PagePreviewData) => void;
  onDeleted: (pageId: number) => void;
  onRename: (page: PagePreviewData) => void;
  onMove: (page: PagePreviewData) => void;
}

export function PagePreviewPanel({
  page, spaceName, spaceColor, onClose, onOpenPage, onOpenComments, onUpdated, onDeleted, onRename, onMove,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const colors = SPACE_COLOR_MAP[spaceColor] ?? SPACE_COLOR_MAP.violet;
  const tpl = TEMPLATE_LABELS[page.template] ?? TEMPLATE_LABELS.blank;
  const linkedCount = (() => {
    try { return JSON.parse(page.linkedTaskIds ?? "[]").length; }
    catch { return 0; }
  })();

  function handleFavorite() {
    startTransition(async () => {
      const updated = await togglePageFavorite(page.id, page.isFavorited);
      if (updated) onUpdated({ ...page, isFavorited: updated.isFavorited });
    });
  }

  function handleArchive() {
    if (!confirm(`Archive "${page.name}"?`)) return;
    startTransition(async () => {
      await archivePage(page.id);
      onDeleted(page.id);
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      await duplicatePage(page.id);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${page.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deletePage(page.id);
      onDeleted(page.id);
    });
  }

  function handleShare() {
    const url = `${window.location.origin}/spaces?page=${page.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport() {
    const content = (page as any).content || `# ${page.name}\n\n${page.description || ""}`;
    const container = document.createElement("div");
    container.innerHTML = content;
    const textContent = container.innerText || container.textContent || "";

    const blob = new Blob([`# ${page.name}\n\n${textContent}`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const actions = [
    { icon: Edit3,    label: "Rename",    action: () => onRename(page), },
    { icon: Move,     label: "Move",      action: () => onMove(page),   },
    { icon: Copy,     label: "Duplicate", action: handleDuplicate,       },
    { icon: Star,     label: page.isFavorited ? "Unfavorite" : "Favorite", action: handleFavorite, active: page.isFavorited },
    { icon: copied ? Check : Share2, label: copied ? "Copied!" : "Share", action: handleShare, active: copied },
    { icon: Download, label: "Export",    action: handleExport,         },
    { icon: Archive,  label: "Archive",   action: handleArchive,        },
    { icon: Trash2,   label: "Delete",    action: handleDelete, danger: true },
  ];

  return (
    <div
      className="flex flex-col h-full rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-200"
      style={{ animationFillMode: "both" }}
    >
      {/* Header */}
      <div className={`px-5 pt-5 pb-4 border-b border-slate-100 ${colors.light}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none">{tpl.icon}</span>
            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{page.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 grid size-7 place-items-center rounded-xl text-slate-400 hover:bg-white/80 hover:text-slate-600 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Type badge */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tpl.color}`}>
            <FileText className="size-3" /> {tpl.label}
          </span>
          {page.isFavorited && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Star className="size-3 fill-amber-500" /> Favorited
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Open Page Button */}
        {onOpenPage && (
          <button
            type="button"
            onClick={() => onOpenPage(page)}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-xs shadow-md hover:from-violet-600 hover:to-indigo-600 transition-all"
          >
            <ExternalLink className="size-3.5" />
            Open & Edit Document
          </button>
        )}

        {/* Space */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`grid size-6 place-items-center rounded-lg bg-gradient-to-br ${colors.gradient}`}>
            <Folder className="size-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-700">{spaceName}</span>
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {page.description || <span className="italic text-slate-400">No description added yet.</span>}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenComments?.(page)}
            className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left hover:border-violet-200 hover:bg-violet-50/50 transition-all group"
          >
            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-violet-600 mb-1">
              <MessageSquare className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Comments</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 group-hover:text-violet-700">{page.commentsCount}</p>
          </button>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Link2 className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Linked Tasks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{linkedCount}</p>
          </div>
        </div>

        {/* Last edited */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="size-3.5" />
          <span>Last edited {formatRelativeTime(page.updatedAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Actions</p>
        <div className="grid grid-cols-4 gap-1.5">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={action.action}
                disabled={isPending}
                title={action.label}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-all duration-150 disabled:opacity-40 ${
                  (action as any).danger
                    ? "text-rose-500 hover:bg-rose-50"
                    : (action as any).active
                    ? `${colors.text} ${colors.light}`
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
