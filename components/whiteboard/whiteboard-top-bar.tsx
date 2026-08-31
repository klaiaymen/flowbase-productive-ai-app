"use client";

import { useState } from "react";
import type { Whiteboard } from "@/db/schema";
import {
  Sparkles,
  Download,
  StickyNote,
  Pencil,
  Check,
  RotateCcw,
  Palette,
  MoreHorizontal,
  Copy,
  Trash2,
  CheckCircle2,
  Loader2,
  Users,
  UserPlus,
} from "lucide-react";
import { useOthers, useSelf } from "@liveblocks/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhiteboardTopBarProps {
  board: Whiteboard;
  saveStatus: "saved" | "saving" | "unsaved";
  onRename: (newName: string) => void;
  onOpenAiModal: () => void;
  onOpenInviteModal: () => void;
  onExportPng: () => void;
  onAddStickyNote: (color: string) => void;
  onClearCanvas: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const stickyNoteColors = [
  { label: "Yellow", value: "#fef08a", bgClass: "bg-yellow-200" },
  { label: "Green", value: "#bbf7d0", bgClass: "bg-emerald-200" },
  { label: "Blue", value: "#bfdbfe", bgClass: "bg-sky-200" },
  { label: "Pink", value: "#fbcfe8", bgClass: "bg-pink-200" },
  { label: "Purple", value: "#e9d5ff", bgClass: "bg-purple-200" },
];

export function WhiteboardTopBar({
  board,
  saveStatus,
  onRename,
  onOpenAiModal,
  onOpenInviteModal,
  onExportPng,
  onAddStickyNote,
  onClearCanvas,
  onDuplicate,
  onDelete,
}: WhiteboardTopBarProps) {
  const others = useOthers();
  const self = useSelf();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.name);
  const [showStickyPicker, setShowStickyPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleTitleSubmit = () => {
    if (title.trim() && title !== board.name) {
      onRename(title.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Title & Save Status */}
      <div className="flex items-center gap-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTitle(board.name);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="bg-slate-100 font-semibold text-slate-900 text-sm px-2.5 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleTitleSubmit}
              className="size-7 text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="size-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="flex items-center gap-2 group hover:bg-slate-100/80 px-2 py-1 rounded-lg transition-colors"
          >
            <h1 className="font-semibold text-slate-900 text-sm tracking-tight">{board.name}</h1>
            <Pencil className="size-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Save Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-500">
          {saveStatus === "saving" ? (
            <>
              <Loader2 className="size-3 animate-spin text-amber-500" />
              <span className="text-amber-700">Saving…</span>
            </>
          ) : saveStatus === "unsaved" ? (
            <>
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span>Unsaved</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span className="text-emerald-700">Saved</span>
            </>
          )}
        </div>

        {/* Live Multiplayer Presence Indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60 shadow-2xs">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <Users className="size-3 text-emerald-600" />
            <span>{others.length + 1} online</span>
          </div>

          {/* Collaborators Avatar Stack */}
          <div className="hidden sm:flex items-center">
            {self && (
              <img
                src={(self.info as any)?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=self`}
                alt={(self.info as any)?.name || "You"}
                title={`${(self.info as any)?.name || "You"} (You)`}
                className="size-7 rounded-full border-2 border-emerald-400 shadow-xs z-10"
              />
            )}
            {others.slice(0, 3).map(({ connectionId, info }) => (
              <img
                key={connectionId}
                src={(info as any)?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${connectionId}`}
                alt={(info as any)?.name || "Collaborator"}
                title={(info as any)?.name || "Collaborator"}
                className="size-7 rounded-full border-2 border-white shadow-xs -ml-2 hover:z-20 transition-all"
              />
            ))}
            {others.length > 3 && (
              <div className="size-7 rounded-full bg-slate-200 border-2 border-white text-[10px] font-extrabold text-slate-600 flex items-center justify-center -ml-2 z-10">
                +{others.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Share / Invite Collaborators Button */}
        <Button
          onClick={onOpenInviteModal}
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="size-4 text-emerald-600" />
          <span>Share</span>
        </Button>
        {/* Sticky Notes Quick Action */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStickyPicker(!showStickyPicker)}
            className="h-9 gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200 rounded-xl text-xs font-medium shadow-xs"
          >
            <StickyNote className="size-4 text-amber-500" />
            <span>Sticky Note</span>
          </Button>

          {showStickyPicker && (
            <div className="absolute right-0 top-11 z-30 p-2 bg-white rounded-xl shadow-xl border border-slate-200 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
              {stickyNoteColors.map((col) => (
                <button
                  key={col.value}
                  onClick={() => {
                    onAddStickyNote(col.value);
                    setShowStickyPicker(false);
                  }}
                  title={`Add ${col.label} sticky note`}
                  className={cn(
                    "size-7 rounded-lg transition-transform hover:scale-110 shadow-xs border border-slate-300/40",
                    col.bgClass
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Diagram Generator Button */}
        <Button
          onClick={onOpenAiModal}
          className="h-9 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-medium shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02]"
        >
          <Sparkles className="size-4 animate-pulse" />
          <span>AI Diagram</span>
        </Button>

        {/* Export PNG */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPng}
          className="h-9 gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium shadow-xs"
        >
          <Download className="size-4 text-slate-600" />
          <span>Export PNG</span>
        </Button>

        {/* More Options Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="size-9 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <MoreHorizontal className="size-4" />
          </Button>

          {showMoreMenu && (
            <div className="absolute right-0 top-11 z-30 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1 space-y-0.5 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  onClearCanvas();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
              >
                <RotateCcw className="size-3.5 text-slate-500" />
                Clear Board
              </button>

              <button
                onClick={() => {
                  onDuplicate();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
              >
                <Copy className="size-3.5 text-slate-500" />
                Duplicate Board
              </button>

              <button
                onClick={() => {
                  onDelete();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
              >
                <Trash2 className="size-3.5" />
                Delete Board
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
