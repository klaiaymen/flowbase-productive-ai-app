"use client";

import { useState } from "react";
import { AllSpacesView } from "./all-spaces-view";
import { SpaceDetailView } from "./space-detail-view";
import type { SpaceCardData } from "./space-card";
import { updateSpace } from "@/app/spaces/actions";
import { SPACE_COLOR_MAP } from "./space-card";

const SPACE_COLORS_LIST = [
  { id: "violet",  bg: "bg-violet-500"  },
  { id: "sky",     bg: "bg-sky-500"     },
  { id: "emerald", bg: "bg-emerald-500" },
  { id: "amber",   bg: "bg-amber-500"   },
  { id: "rose",    bg: "bg-rose-500"    },
  { id: "indigo",  bg: "bg-indigo-500"  },
  { id: "cyan",    bg: "bg-cyan-500"    },
  { id: "fuchsia", bg: "bg-fuchsia-500" },
];

interface Props {
  initialSpaces: SpaceCardData[];
}

export function SpacesClient({ initialSpaces }: Props) {
  const [view, setView] = useState<"spaces" | "pages">("spaces");
  const [selectedSpace, setSelectedSpace] = useState<SpaceCardData | null>(null);
  const [spaces, setSpaces] = useState<SpaceCardData[]>(initialSpaces);

  const [renameTargetSpace, setRenameTargetSpace] = useState<SpaceCardData | null>(null);
  const [colorTargetSpace, setColorTargetSpace] = useState<SpaceCardData | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleOpenSpace(space: SpaceCardData) {
    setSelectedSpace(space);
    setView("pages");
  }

  function handleBack() {
    setSelectedSpace(null);
    setView("spaces");
  }

  function handleSpaceUpdated(updated: SpaceCardData) {
    setSpaces((prev) => {
      const exists = prev.find((s) => s.id === updated.id);
      if (exists) return prev.map((s) => s.id === updated.id ? updated : s);
      return [updated, ...prev];
    });
    if (selectedSpace?.id === updated.id) setSelectedSpace(updated);
  }

  async function handleRenameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!renameTargetSpace) return;
    const fd = new FormData(e.currentTarget);
    const newName = (fd.get("name") as string).trim();
    if (!newName) return;

    setIsPending(true);
    try {
      const updated = await updateSpace(renameTargetSpace.id, { name: newName });
      if (updated) handleSpaceUpdated({ ...renameTargetSpace, name: updated.name });
      setRenameTargetSpace(null);
    } finally {
      setIsPending(false);
    }
  }

  async function handleColorChange(spaceId: number, color: string) {
    if (!colorTargetSpace) return;
    setIsPending(true);
    try {
      const updated = await updateSpace(spaceId, { color });
      if (updated) handleSpaceUpdated({ ...colorTargetSpace, color: updated.color });
      setColorTargetSpace(null);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      {view === "pages" && selectedSpace ? (
        <SpaceDetailView
          space={selectedSpace}
          onBack={handleBack}
          onRenameSpace={(s) => setRenameTargetSpace(s)}
          onChangeColor={(s) => setColorTargetSpace(s)}
          onSpaceUpdated={handleSpaceUpdated}
        />
      ) : (
        <AllSpacesView
          initialSpaces={spaces}
          onOpenSpace={handleOpenSpace}
        />
      )}

      {/* Rename space modal */}
      {renameTargetSpace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setRenameTargetSpace(null); }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Rename Space</h3>
            <form onSubmit={handleRenameSubmit} className="flex flex-col gap-3">
              <input
                name="name"
                type="text"
                defaultValue={renameTargetSpace.name}
                autoFocus
                maxLength={60}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRenameTargetSpace(null)} className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isPending} className="h-9 rounded-xl px-5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-md disabled:opacity-50 transition-all">
                  {isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change space color modal */}
      {colorTargetSpace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setColorTargetSpace(null); }}
        >
          <div className="w-full max-w-xs rounded-3xl border border-white/80 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Change Color</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {SPACE_COLORS_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleColorChange(colorTargetSpace.id, c.id)}
                  disabled={isPending}
                  title={c.id}
                  className={`size-9 rounded-full ${c.bg} transition-all hover:scale-110 active:scale-95 ${
                    colorTargetSpace.color === c.id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setColorTargetSpace(null)}
              className="mt-4 w-full h-9 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
