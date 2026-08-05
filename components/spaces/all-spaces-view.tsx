"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Plus, Search, LayoutGrid, List, SlidersHorizontal, ChevronDown,
  Folder, Star, Clock, Archive, Layers3,
} from "lucide-react";
import { SpaceCard, type SpaceCardData, SPACE_COLOR_MAP } from "./space-card";
import { CreateSpaceModal } from "./create-space-modal";
import { CreatePageModal } from "./create-page-modal";
import { InviteMembersModal } from "./invite-members-modal";
import { updateSpace } from "@/app/spaces/actions";

type FilterTab = "all" | "favorites" | "recent" | "archived";
type SortOption = "updated" | "name" | "pages" | "favorites";
type ViewMode = "grid" | "list";

const SORT_LABELS: Record<SortOption, string> = {
  updated:   "Recently Updated",
  name:      "Name",
  pages:     "Most Pages",
  favorites: "Favorites",
};

const SPACE_COLORS_LIST = [
  { id: "violet",  bg: "bg-violet-500",  gradient: "from-violet-400 to-violet-600"  },
  { id: "sky",     bg: "bg-sky-500",     gradient: "from-sky-400 to-sky-600"        },
  { id: "emerald", bg: "bg-emerald-500", gradient: "from-emerald-400 to-emerald-600" },
  { id: "amber",   bg: "bg-amber-500",   gradient: "from-amber-400 to-amber-600"    },
  { id: "rose",    bg: "bg-rose-500",    gradient: "from-rose-400 to-rose-600"      },
  { id: "indigo",  bg: "bg-indigo-500",  gradient: "from-indigo-400 to-indigo-600"  },
  { id: "cyan",    bg: "bg-cyan-500",    gradient: "from-cyan-400 to-cyan-600"      },
  { id: "fuchsia", bg: "bg-fuchsia-500", gradient: "from-fuchsia-400 to-fuchsia-600" },
];

interface Props {
  initialSpaces: SpaceCardData[];
  onOpenSpace: (space: SpaceCardData) => void;
}

export function AllSpacesView({ initialSpaces, onOpenSpace }: Props) {
  const [spaces, setSpaces] = useState<SpaceCardData[]>(initialSpaces);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortOption>("updated");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showInvite, setShowInvite] = useState<{ space: SpaceCardData } | null>(null);
  const [showRename, setShowRename] = useState<{ space: SpaceCardData } | null>(null);
  const [showChangeColor, setShowChangeColor] = useState<{ space: SpaceCardData } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Derived: filtered + sorted
  const displayed = useMemo(() => {
    let list = [...spaces];

    // Filter
    if (filter === "favorites") list = list.filter((s) => s.isFavorited);
    else if (filter === "recent") list = list.filter((s) => !s.isArchived);
    else if (filter === "archived") list = list.filter((s) => s.isArchived);
    else list = list.filter((s) => !s.isArchived); // "all" hides archived

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "pages") list.sort((a, b) => b.pageCount - a.pageCount);
    else if (sort === "favorites") list.sort((a, b) => Number(b.isFavorited) - Number(a.isFavorited));
    else list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return list;
  }, [spaces, filter, sort, search]);

  const activeSpaceCount = spaces.filter((s) => !s.isArchived).length;

  const tabCounts = {
    all: spaces.filter((s) => !s.isArchived).length,
    favorites: spaces.filter((s) => s.isFavorited).length,
    recent: spaces.filter((s) => !s.isArchived).length,
    archived: spaces.filter((s) => s.isArchived).length,
  };

  function handleSpaceCreated(space: any) {
    setSpaces((prev) => [
      { ...space, pageCount: 0, memberEmails: [] } as SpaceCardData,
      ...prev,
    ]);
  }

  function handleSpaceUpdated(updated: SpaceCardData) {
    setSpaces((prev) => {
      const exists = prev.find((s) => s.id === updated.id);
      if (exists) return prev.map((s) => s.id === updated.id ? updated : s);
      // New space from duplicate — append
      return [updated, ...prev];
    });
  }

  function handleSpaceDeleted(id: number) {
    setSpaces((prev) => prev.filter((s) => s.id !== id));
  }

  function handleRenameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!showRename) return;
    const fd = new FormData(e.currentTarget);
    const newName = (fd.get("name") as string).trim();
    if (!newName) return;
    startTransition(async () => {
      const updated = await updateSpace(showRename.space.id, { name: newName });
      if (updated) handleSpaceUpdated({ ...showRename.space, name: updated.name });
      setShowRename(null);
    });
  }

  function handleColorChange(spaceId: number, color: string) {
    startTransition(async () => {
      const updated = await updateSpace(spaceId, { color });
      if (updated && showChangeColor) {
        handleSpaceUpdated({ ...showChangeColor.space, color: updated.color });
      }
      setShowChangeColor(null);
    });
  }

  const FILTER_TABS: { id: FilterTab; label: string; icon: React.ElementType }[] = [
    { id: "all",      label: "All Spaces",      icon: Layers3  },
    { id: "favorites", label: "Favorites",       icon: Star     },
    { id: "recent",   label: "Recently Opened", icon: Clock    },
    { id: "archived", label: "Archived",         icon: Archive  },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/90 bg-white/74 p-5 shadow-[0_20px_60px_rgba(109,40,217,0.1)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Workspace</p>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-950">All Spaces</h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{activeSpaceCount}</span>
            {" "}{activeSpaceCount === 1 ? "space" : "spaces"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search spaces or pages..."
              className="h-10 w-64 rounded-xl border border-slate-200 bg-white/90 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCreateSpace(true)}
            className="flex items-center gap-1.5 h-10 rounded-xl px-4 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-md shadow-violet-200/60 transition-all"
          >
            <Plus className="size-4" />
            New Space
          </button>
        </div>
      </header>

      {/* ── Filter tabs + controls ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {tabCounts[tab.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View + Sort controls */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <SlidersHorizontal className="size-3.5" />
              {SORT_LABELS[sort]}
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            {sortMenuOpen && (
              <div className="absolute right-0 top-10 z-20 w-48 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-150">
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setSort(key as SortOption); setSortMenuOpen(false); }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                      sort === key ? "text-violet-600 bg-violet-50" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                    {sort === key && <span className="size-1.5 rounded-full bg-violet-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {(["grid", "list"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`grid size-9 place-items-center transition-colors ${
                  view === v ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
                title={v === "grid" ? "Grid view" : "List view"}
              >
                {v === "grid" ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Spaces Grid / List ── */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-400 to-indigo-500 shadow-lg opacity-40">
            <Folder className="size-9 text-white" />
          </div>
          <p className="text-slate-500 font-semibold text-lg">
            {search ? `No results for "${search}"` : filter === "favorites" ? "No favorite spaces yet" : filter === "archived" ? "Nothing archived" : "No spaces yet"}
          </p>
          <p className="text-sm text-slate-400">
            {!search && filter === "all" && "Create your first space to start organizing pages"}
          </p>
          {!search && filter === "all" && (
            <button
              type="button"
              onClick={() => setShowCreateSpace(true)}
              className="mt-1 flex items-center gap-1.5 h-10 rounded-xl px-5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-md transition-all"
            >
              <Plus className="size-4" />
              Create your first space
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          {displayed.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              onOpen={onOpenSpace}
              onRename={(s) => setShowRename({ space: s })}
              onChangeColor={(s) => setShowChangeColor({ space: s })}
              onAddPage={(s) => setShowCreatePage(true)}
              onInvite={(s) => setShowInvite({ space: s })}
              onUpdated={handleSpaceUpdated}
              onDeleted={handleSpaceDeleted}
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_100px_120px_80px] gap-2 border-b border-slate-100 px-5 py-3 bg-slate-50/60">
            {["Space", "Color", "Pages", "Last Updated", ""].map((h) => (
              <div key={h} className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</div>
            ))}
          </div>
          <div className="divide-y divide-slate-50">
            {displayed.map((space) => {
              const colors = SPACE_COLOR_MAP[space.color] ?? SPACE_COLOR_MAP.violet;
              return (
                <div
                  key={space.id}
                  onClick={() => onOpenSpace(space)}
                  className="grid grid-cols-[1fr_120px_100px_120px_80px] gap-2 items-center px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${colors.gradient} shadow-sm`}>
                      <Folder className="size-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{space.name}</p>
                      <p className="text-xs text-slate-500 truncate">{space.description || "No description"}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full ${colors.light} ${colors.text} px-2.5 py-0.5 text-[11px] font-semibold capitalize`}>
                      {space.color}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{space.pageCount} pages</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(space.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    {space.isFavorited && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                    {space.isArchived && <Archive className="size-3.5 text-slate-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateSpace && (
        <CreateSpaceModal
          onClose={() => setShowCreateSpace(false)}
          onCreated={handleSpaceCreated}
        />
      )}

      {showCreatePage && (
        <CreatePageModal
          spaces={spaces.filter((s) => !s.isArchived).map((s) => ({ id: s.id, name: s.name, color: s.color }))}
          onClose={() => setShowCreatePage(false)}
          onCreated={() => {}}
        />
      )}

      {showInvite && (
        <InviteMembersModal
          spaceId={showInvite.space.id}
          spaceName={showInvite.space.name}
          onClose={() => setShowInvite(null)}
        />
      )}

      {/* Rename modal */}
      {showRename && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRename(null); }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Rename Space</h3>
            <form onSubmit={handleRenameSubmit} className="flex flex-col gap-3">
              <input
                name="name"
                type="text"
                defaultValue={showRename.space.name}
                autoFocus
                maxLength={60}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRename(null)} className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isPending} className="h-9 rounded-xl px-5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-md disabled:opacity-50 transition-all">
                  {isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change color modal */}
      {showChangeColor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowChangeColor(null); }}
        >
          <div className="w-full max-w-xs rounded-3xl border border-white/80 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Change Color</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {SPACE_COLORS_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleColorChange(showChangeColor.space.id, c.id)}
                  disabled={isPending}
                  title={c.id}
                  className={`size-9 rounded-full ${c.bg} transition-all hover:scale-110 active:scale-95 ${
                    showChangeColor.space.color === c.id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowChangeColor(null)}
              className="mt-4 w-full h-9 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
