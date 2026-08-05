"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Move, Folder } from "lucide-react";
import { getSpaces, movePage } from "@/app/spaces/actions";
import type { PagePreviewData } from "./page-preview-panel";
import { SPACE_COLOR_MAP } from "./space-card";

interface SpaceItem {
  id: number;
  name: string;
  color: string;
}

interface Props {
  page: PagePreviewData;
  onClose: () => void;
  onMoved: (targetSpaceId: number) => void;
}

export function MovePageModal({ page, onClose, onMoved }: Props) {
  const [spacesList, setSpacesList] = useState<SpaceItem[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getSpaces().then((spaces) => {
      const available = spaces.filter((s) => !s.isArchived);
      setSpacesList(available);
      const other = available.find((s) => s.id !== page.spaceId);
      if (other) setSelectedSpaceId(other.id);
      setLoading(false);
    });
  }, [page.spaceId]);

  function handleMove() {
    if (!selectedSpaceId || selectedSpaceId === page.spaceId) return;
    setError("");

    startTransition(async () => {
      try {
        await movePage(page.id, selectedSpaceId);
        onMoved(selectedSpaceId);
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to move page.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-600">
              <Move className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Move Page</h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">"{page.name}"</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-700">Select Destination Space</p>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading spaces…</div>
          ) : spacesList.length <= 1 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
              No other spaces available to move this page to.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {spacesList.map((space) => {
                const colors = SPACE_COLOR_MAP[space.color] ?? SPACE_COLOR_MAP.violet;
                const isCurrent = space.id === page.spaceId;
                const isSelected = selectedSpaceId === space.id;

                return (
                  <button
                    key={space.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => setSelectedSpaceId(space.id)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-all ${
                      isCurrent
                        ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "border-violet-500 bg-violet-50/70 text-violet-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${colors.gradient}`}>
                        <Folder className="size-3.5 text-white" />
                      </div>
                      <span className="text-sm font-semibold truncate">{space.name}</span>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    ) : isSelected ? (
                      <span className="size-2 rounded-full bg-violet-600" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMove}
              disabled={isPending || !selectedSpaceId || selectedSpaceId === page.spaceId}
              className="h-9 rounded-xl px-5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-md disabled:opacity-50 transition-all"
            >
              {isPending ? "Moving…" : "Move Page"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
