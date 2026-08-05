"use client";

import { useState, useTransition, useEffect } from "react";
import {
  ChevronRight, Plus, MoreHorizontal, Star, ArrowLeft,
  FileText, Clock, Edit3, Palette, UserPlus, Archive, Trash2, ExternalLink
} from "lucide-react";
import { getPages, togglePageFavorite } from "@/app/spaces/actions";
import { CreatePageModal } from "./create-page-modal";
import { PagePreviewPanel, type PagePreviewData } from "./page-preview-panel";
import { PageEditor } from "./page-editor";
import { PageCommentsPanel } from "./page-comments-panel";
import { RenamePageModal } from "./rename-page-modal";
import { MovePageModal } from "./move-page-modal";
import { InviteMembersModal } from "./invite-members-modal";
import { SPACE_COLOR_MAP, type SpaceCardData } from "./space-card";

const TEMPLATE_LABELS: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  "blank":          { label: "Page",           icon: "📄", bg: "bg-slate-100",   text: "text-slate-600"   },
  "project-plan":   { label: "Project Plan",   icon: "📋", bg: "bg-sky-100",     text: "text-sky-700"     },
  "meeting-notes":  { label: "Meeting Notes",  icon: "📝", bg: "bg-violet-100",  text: "text-violet-700"  },
  "prd":            { label: "Document",       icon: "📐", bg: "bg-indigo-100",  text: "text-indigo-700"  },
  "research-notes": { label: "Research Notes", icon: "🔬", bg: "bg-emerald-100", text: "text-emerald-700" },
  "task-plan":      { label: "Task Plan",      icon: "✅", bg: "bg-amber-100",   text: "text-amber-700"   },
};

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return "Last week";
}

interface Props {
  space: SpaceCardData;
  onBack: () => void;
  onRenameSpace: (space: SpaceCardData) => void;
  onChangeColor: (space: SpaceCardData) => void;
  onSpaceUpdated: (space: SpaceCardData) => void;
}

export function SpaceDetailView({ space, onBack, onRenameSpace, onChangeColor, onSpaceUpdated }: Props) {
  const colors = SPACE_COLOR_MAP[space.color] ?? SPACE_COLOR_MAP.violet;

  const [pagesList, setPagesList] = useState<PagePreviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<PagePreviewData | null>(null);
  const [editingPage, setEditingPage] = useState<PagePreviewData | null>(null);
  const [showComments, setShowComments] = useState<PagePreviewData | null>(null);

  const [renameTargetPage, setRenameTargetPage] = useState<PagePreviewData | null>(null);
  const [moveTargetPage, setMoveTargetPage] = useState<PagePreviewData | null>(null);

  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLoading(true);
    getPages(space.id).then((p) => {
      setPagesList(p as PagePreviewData[]);
      setLoading(false);
    });
  }, [space.id]);

  function handlePageCreated(page: any) {
    setPagesList((prev) => [page as PagePreviewData, ...prev]);
    onSpaceUpdated({ ...space, pageCount: space.pageCount + 1 });
    // Automatically open editor for newly created page
    setEditingPage(page as PagePreviewData);
  }

  function handlePageFavorite(page: PagePreviewData) {
    startTransition(async () => {
      const updated = await togglePageFavorite(page.id, page.isFavorited);
      if (updated) {
        setPagesList((prev) => prev.map((p) => p.id === page.id ? { ...p, isFavorited: updated.isFavorited } : p));
        if (selectedPage?.id === page.id) setSelectedPage({ ...selectedPage, isFavorited: updated.isFavorited });
        if (editingPage?.id === page.id) setEditingPage({ ...editingPage, isFavorited: updated.isFavorited });
      }
    });
  }

  function handlePageDeleted(pageId: number) {
    setPagesList((prev) => prev.filter((p) => p.id !== pageId));
    if (selectedPage?.id === pageId) setSelectedPage(null);
    if (editingPage?.id === pageId) setEditingPage(null);
    if (showComments?.id === pageId) setShowComments(null);
    onSpaceUpdated({ ...space, pageCount: Math.max(0, space.pageCount - 1) });
  }

  function handlePageUpdated(updated: PagePreviewData) {
    setPagesList((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    if (selectedPage?.id === updated.id) setSelectedPage(updated);
    if (editingPage?.id === updated.id) setEditingPage(updated);
  }

  function handlePageMoved(pageId: number) {
    setPagesList((prev) => prev.filter((p) => p.id !== pageId));
    if (selectedPage?.id === pageId) setSelectedPage(null);
    if (editingPage?.id === pageId) setEditingPage(null);
    onSpaceUpdated({ ...space, pageCount: Math.max(0, space.pageCount - 1) });
  }

  const spaceMenuItems = [
    { icon: Edit3,    label: "Rename Space",          action: () => { setSpaceMenuOpen(false); onRenameSpace(space); } },
    { icon: Palette,  label: "Change Color",           action: () => { setSpaceMenuOpen(false); onChangeColor(space); } },
    { icon: Plus,     label: "Add Page",               action: () => { setSpaceMenuOpen(false); setShowCreatePage(true); } },
    { icon: UserPlus, label: "Invite Collaborators",   action: () => { setSpaceMenuOpen(false); setShowInvite(true); } },
  ];

  // Render Full Page Editor mode if a page is being edited
  if (editingPage) {
    return (
      <PageEditor
        page={editingPage}
        spaceName={space.name}
        spaceColor={space.color}
        onBack={() => setEditingPage(null)}
        onUpdated={handlePageUpdated}
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Breadcrumb */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 text-xs font-medium transition-colors group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            All Spaces
          </button>
          <ChevronRight className="size-3.5 text-slate-300 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className={`grid size-7 place-items-center rounded-xl bg-gradient-to-br ${colors.gradient} shadow-sm shrink-0`}>
              <FileText className="size-3.5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 truncate">{space.name}</h1>
          </div>
          <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
            {pagesList.length} {pagesList.length === 1 ? "page" : "pages"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreatePage(true)}
            className="flex items-center gap-1.5 h-9 rounded-xl px-4 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-md transition-all"
          >
            <Plus className="size-4" />
            New Page
          </button>

          {/* Space more menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSpaceMenuOpen((o) => !o)}
              className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {spaceMenuOpen && (
              <div className="absolute right-0 top-10 z-30 w-52 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-150">
                {spaceMenuItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button key={i} type="button" onClick={item.action}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors text-slate-600 hover:bg-slate-50"
                    >
                      <Icon className="size-3.5 shrink-0" />{item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main: Table + Preview / Comments panel side by side ── */}
      <div className={`flex gap-4 flex-1 min-h-0 transition-all duration-300`}>
        {/* Pages table */}
        <div className={`flex-1 min-w-0 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col`}>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_160px_140px_100px_80px] gap-2 border-b border-slate-100 px-5 py-3 bg-slate-50/60">
            {["Page Name", "Type", "Last Updated", "Updated By", "Actions"].map((h) => (
              <div key={h} className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</div>
            ))}
          </div>

          {/* Table rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : pagesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className={`grid size-16 place-items-center rounded-3xl bg-gradient-to-br ${colors.gradient} shadow-lg opacity-50`}>
                  <FileText className="size-7 text-white" />
                </div>
                <p className="text-slate-500 font-semibold">No pages yet</p>
                <p className="text-sm text-slate-400">Create your first page in this space</p>
                <button
                  type="button"
                  onClick={() => setShowCreatePage(true)}
                  className="mt-2 flex items-center gap-1.5 h-9 rounded-xl px-4 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-md transition-all"
                >
                  <Plus className="size-4" />
                  Create Page
                </button>
              </div>
            ) : (
              pagesList.map((page) => {
                const tpl = TEMPLATE_LABELS[page.template] ?? TEMPLATE_LABELS.blank;
                const isSelected = selectedPage?.id === page.id && !showComments;
                return (
                  <div
                    key={page.id}
                    onClick={() => { setShowComments(null); setSelectedPage(isSelected ? null : page); }}
                    onDoubleClick={() => setEditingPage(page)}
                    className={`grid grid-cols-[1fr_160px_140px_100px_80px] gap-2 items-center px-5 py-3.5 cursor-pointer transition-colors duration-100 ${
                      isSelected
                        ? `${colors.light} border-l-2 border-l-violet-400`
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">{tpl.icon}</span>
                      <span
                        onClick={(e) => { e.stopPropagation(); setEditingPage(page); }}
                        className="text-sm font-semibold text-slate-800 hover:text-violet-600 truncate hover:underline"
                        title="Click to edit document"
                      >
                        {page.name}
                      </span>
                      {page.isFavorited && <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />}
                    </div>

                    {/* Type badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tpl.bg} ${tpl.text}`}>
                        {tpl.label}
                      </span>
                    </div>

                    {/* Last updated */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="size-3 shrink-0" />
                      {formatRelativeTime(page.updatedAt)}
                    </div>

                    {/* Updated by */}
                    <div className="flex items-center gap-1.5">
                      <div className={`grid size-6 place-items-center rounded-full ${colors.light} ${colors.text} text-[9px] font-bold`}>
                        {page.clerkUserId.slice(-2).toUpperCase()}
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingPage(page); }}
                        className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                        title="Open Editor"
                      >
                        <ExternalLink className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handlePageFavorite(page); }}
                        className={`grid size-7 place-items-center rounded-lg transition-colors ${
                          page.isFavorited ? "text-amber-400" : "text-slate-300 hover:text-amber-400"
                        }`}
                        title={page.isFavorited ? "Unfavorite" : "Favorite"}
                      >
                        <Star className={`size-3.5 ${page.isFavorited ? "fill-amber-400" : ""}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side: Comments Panel OR Preview Panel */}
        {showComments ? (
          <div className="w-80 shrink-0">
            <PageCommentsPanel
              pageId={showComments.id}
              pageName={showComments.name}
              onClose={() => setShowComments(null)}
              onCommentsCountChange={(newCount) => {
                handlePageUpdated({ ...showComments, commentsCount: newCount });
              }}
            />
          </div>
        ) : selectedPage ? (
          <div className="w-72 shrink-0">
            <PagePreviewPanel
              page={selectedPage}
              spaceName={space.name}
              spaceColor={space.color}
              onClose={() => setSelectedPage(null)}
              onOpenPage={(p) => setEditingPage(p)}
              onOpenComments={(p) => setShowComments(p)}
              onUpdated={handlePageUpdated}
              onDeleted={handlePageDeleted}
              onRename={(p) => setRenameTargetPage(p)}
              onMove={(p) => setMoveTargetPage(p)}
            />
          </div>
        ) : null}
      </div>

      {/* ── Modals ── */}
      {showCreatePage && (
        <CreatePageModal
          spaces={[{ id: space.id, name: space.name, color: space.color }]}
          defaultSpaceId={space.id}
          onClose={() => setShowCreatePage(false)}
          onCreated={handlePageCreated}
        />
      )}

      {showInvite && (
        <InviteMembersModal
          spaceId={space.id}
          spaceName={space.name}
          onClose={() => setShowInvite(false)}
        />
      )}

      {renameTargetPage && (
        <RenamePageModal
          page={renameTargetPage}
          onClose={() => setRenameTargetPage(null)}
          onUpdated={(updated) => {
            handlePageUpdated(updated);
            setRenameTargetPage(null);
          }}
        />
      )}

      {moveTargetPage && (
        <MovePageModal
          page={moveTargetPage}
          onClose={() => setMoveTargetPage(null)}
          onMoved={(targetSpaceId) => {
            handlePageMoved(moveTargetPage.id);
            setMoveTargetPage(null);
          }}
        />
      )}
    </div>
  );
}
