"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Whiteboard } from "@/db/schema";
import {
  getWhiteboards,
  createWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  duplicateWhiteboard,
} from "@/app/whiteboard/actions";
import { AppShell } from "@/components/app-shell";
import { WhiteboardPanel } from "@/components/whiteboard/whiteboard-panel";
import { WhiteboardTopBar } from "@/components/whiteboard/whiteboard-top-bar";
import { WhiteboardCanvas, type WhiteboardCanvasRef } from "@/components/whiteboard/whiteboard-canvas";
import { AiDiagramModal } from "@/components/whiteboard/ai-diagram-modal";
import { Loader2, Palette } from "lucide-react";

const colorsList = ["emerald", "violet", "sky", "amber", "rose", "indigo"];

export default function WhiteboardPage() {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const canvasRef = useRef<WhiteboardCanvasRef>(null);

  // Load whiteboards on mount
  useEffect(() => {
    getWhiteboards()
      .then(async (data) => {
        if (!data || data.length === 0) {
          // Create initial default whiteboard if user has none
          const initial = await createWhiteboard("Main Whiteboard", "emerald");
          setWhiteboards([initial]);
          setSelectedId(initial.id);
        } else {
          setWhiteboards(data);
          setSelectedId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading whiteboards:", err);
        setLoading(false);
      });
  }, []);

  const activeBoard = whiteboards.find((b) => b.id === selectedId) || null;

  // Parsed initial elements for Excalidraw
  const parsedElements = useCallback(() => {
    if (!activeBoard?.elements) return [];
    try {
      return JSON.parse(activeBoard.elements);
    } catch {
      return [];
    }
  }, [activeBoard?.elements])();

  // Parsed initial appState for Excalidraw
  const parsedAppState = useCallback(() => {
    if (!activeBoard?.appState) return {};
    try {
      return JSON.parse(activeBoard.appState);
    } catch {
      return {};
    }
  }, [activeBoard?.appState])();

  // Create Whiteboard
  const handleCreate = useCallback(async () => {
    const nextColor = colorsList[whiteboards.length % colorsList.length];
    const newBoard = await createWhiteboard(`Whiteboard ${whiteboards.length + 1}`, nextColor);
    setWhiteboards((prev) => [newBoard, ...prev]);
    setSelectedId(newBoard.id);
  }, [whiteboards.length]);

  // Rename Whiteboard
  const handleRename = useCallback(async (id: number, name: string) => {
    setWhiteboards((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
    await updateWhiteboard(id, { name });
  }, []);

  // Delete Whiteboard
  const handleDelete = useCallback(async (id: number) => {
    setWhiteboards((prev) => prev.filter((b) => b.id !== id));
    await deleteWhiteboard(id);

    setWhiteboards((updated) => {
      if (selectedId === id && updated.length > 0) {
        setSelectedId(updated[0].id);
      } else if (updated.length === 0) {
        setSelectedId(null);
      }
      return updated;
    });
  }, [selectedId]);

  // Duplicate Whiteboard
  const handleDuplicate = useCallback(async (id: number) => {
    const copy = await duplicateWhiteboard(id);
    setWhiteboards((prev) => [copy, ...prev]);
    setSelectedId(copy.id);
  }, []);

  // Save canvas changes to DB
  const handleCanvasChange = useCallback(
    async (elements: any[], appState: any) => {
      if (!selectedId) return;

      setSaveStatus("saving");
      try {
        const elementsJson = JSON.stringify(elements);
        const appStateJson = JSON.stringify({
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
        });

        await updateWhiteboard(selectedId, {
          elements: elementsJson,
          appState: appStateJson,
        });

        setWhiteboards((prev) =>
          prev.map((b) =>
            b.id === selectedId
              ? { ...b, elements: elementsJson, appState: appStateJson, updatedAt: new Date() }
              : b
          )
        );
        setSaveStatus("saved");
      } catch (err) {
        console.error("Save error:", err);
        setSaveStatus("unsaved");
      }
    },
    [selectedId]
  );

  // AI Diagram Inserted
  const handleAiDiagramGenerated = (elements: any[], isFallback: boolean, message?: string) => {
    if (canvasRef.current) {
      canvasRef.current.addDiagramElements(elements);
    }
    if (message || isFallback) {
      setNotification(message || "Diagram elements added to canvas!");
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <Palette className="size-6 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-slate-400" />
              <p className="text-xs font-medium text-slate-500">Loading whiteboards…</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell noPadding>
      <div className="flex h-screen overflow-hidden bg-slate-100">
        {/* Left Whiteboard List Panel */}
        <WhiteboardPanel
          whiteboards={whiteboards}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />

        {/* Right Canvas Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">
          {activeBoard ? (
            <>
              {/* Top Bar */}
              <WhiteboardTopBar
                board={activeBoard}
                saveStatus={saveStatus}
                onRename={(name) => handleRename(activeBoard.id, name)}
                onOpenAiModal={() => setIsAiModalOpen(true)}
                onExportPng={() => canvasRef.current?.exportPng(activeBoard.name)}
                onAddStickyNote={(color) => canvasRef.current?.addStickyNote(color)}
                onClearCanvas={() => canvasRef.current?.clearCanvas()}
                onDuplicate={() => handleDuplicate(activeBoard.id)}
                onDelete={() => handleDelete(activeBoard.id)}
              />

              {/* Notification Banner */}
              {notification && (
                <div className="absolute top-16 right-4 z-40 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                  {notification}
                </div>
              )}

              {/* Excalidraw Canvas Workspace */}
              <div className="flex-1 w-full h-full relative overflow-hidden">
                <WhiteboardCanvas
                  key={activeBoard.id}
                  ref={canvasRef}
                  initialElements={parsedElements}
                  initialAppState={parsedAppState}
                  onChange={handleCanvasChange}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
              <div className="size-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Palette className="size-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">No Whiteboard Selected</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Select a whiteboard from the left panel or create a new one to start drawing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Diagram Modal */}
      <AiDiagramModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerate={handleAiDiagramGenerated}
      />
    </AppShell>
  );
}
