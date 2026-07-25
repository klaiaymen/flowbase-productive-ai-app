"use client";

import { useState } from "react";
import type { Whiteboard } from "@/db/schema";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Palette,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhiteboardPanelProps {
  whiteboards: Whiteboard[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
}

const colorBadgeMap: Record<string, { bg: string; border: string; text: string }> = {
  emerald: { bg: "bg-emerald-500", border: "border-emerald-200", text: "text-emerald-700" },
  violet: { bg: "bg-violet-500", border: "border-violet-200", text: "text-violet-700" },
  sky: { bg: "bg-sky-500", border: "border-sky-200", text: "text-sky-700" },
  amber: { bg: "bg-amber-500", border: "border-amber-200", text: "text-amber-700" },
  rose: { bg: "bg-rose-500", border: "border-rose-200", text: "text-rose-700" },
  indigo: { bg: "bg-indigo-500", border: "border-indigo-200", text: "text-indigo-700" },
};

function formatTimeAgo(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WhiteboardPanel({
  whiteboards,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
}: WhiteboardPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const filtered = whiteboards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (b: Whiteboard, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(b.id);
    setEditName(b.name);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: number) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditingId(null);
  };

  if (isCollapsed) {
    return (
      <div className="h-full border-r border-slate-200/80 bg-white/70 backdrop-blur-md flex flex-col items-center py-4 px-2 gap-4 transition-all w-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          title="Expand panel"
          className="text-slate-500 hover:text-slate-900"
        >
          <ChevronRight className="size-5" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={onCreate}
          title="New Whiteboard"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl"
        >
          <Plus className="size-5" />
        </Button>
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-2 w-full pt-2">
          {whiteboards.map((b) => {
            const badge = colorBadgeMap[b.color] || colorBadgeMap.emerald;
            const isSelected = b.id === selectedId;
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                title={b.name}
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-all relative group",
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-700"
                )}
              >
                <Palette className="size-4" />
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white",
                    badge.bg
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border-r border-slate-200/80 bg-white/70 backdrop-blur-md flex flex-col w-[280px] shrink-0 transition-all select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Palette className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm tracking-tight">Whiteboards</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {whiteboards.length} {whiteboards.length === 1 ? "board" : "boards"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          title="Collapse panel"
          className="size-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* New Board Action */}
      <div className="p-3 border-b border-slate-100 flex flex-col gap-2.5">
        <Button
          onClick={onCreate}
          className="w-full justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-xl h-10 font-medium text-xs transition-all hover:scale-[1.01]"
        >
          <Plus className="size-4" />
          New Whiteboard
        </Button>

        {/* Search Input */}
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search whiteboards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100/70 border-0 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
          />
        </div>
      </div>

      {/* Whiteboard List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="size-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <Sparkles className="size-5" />
            </div>
            <p className="text-xs font-medium text-slate-600">No whiteboards found</p>
            <p className="text-[11px] text-slate-400 mt-1">Create one to start freeform drawing.</p>
          </div>
        ) : (
          filtered.map((board) => {
            const isSelected = board.id === selectedId;
            const badge = colorBadgeMap[board.color] || colorBadgeMap.emerald;

            return (
              <div
                key={board.id}
                onClick={() => onSelect(board.id)}
                className={cn(
                  "group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border",
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white/50 hover:bg-slate-100/80 text-slate-700 border-transparent hover:border-slate-200/60"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn("size-2.5 rounded-full shrink-0", badge.bg)} />
                  
                  {editingId === board.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveRename(board.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(board.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white text-slate-900 text-xs font-medium px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{board.name}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-70">
                        <Clock className="size-3" />
                        <span>{formatTimeAgo(board.updatedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Menu Button */}
                <div className="relative shrink-0 ml-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === board.id ? null : board.id);
                    }}
                    className={cn(
                      "size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
                      isSelected ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-500",
                      menuOpenId === board.id && "opacity-100"
                    )}
                  >
                    <MoreVertical className="size-3.5" />
                  </Button>

                  {/* Dropdown Menu */}
                  {menuOpenId === board.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 z-30 w-36 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1 space-y-0.5 text-slate-700 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <button
                        onClick={(e) => handleStartRename(board, e)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                      >
                        <Pencil className="size-3.5 text-slate-500" />
                        Rename
                      </button>

                      <button
                        onClick={() => {
                          onDuplicate(board.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                      >
                        <Copy className="size-3.5 text-slate-500" />
                        Duplicate
                      </button>

                      <button
                        onClick={() => {
                          onDelete(board.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
