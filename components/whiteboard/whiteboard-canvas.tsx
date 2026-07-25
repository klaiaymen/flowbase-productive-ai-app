"use client";

import "@excalidraw/excalidraw/index.css";
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import of Excalidraw (CSR only)
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-500" />
          <p className="text-xs text-slate-500 font-medium">Loading Whiteboard Canvas…</p>
        </div>
      </div>
    ),
  }
);

export interface WhiteboardCanvasRef {
  addStickyNote: (color: string) => void;
  addDiagramElements: (newElements: any[]) => void;
  exportPng: (fileName: string) => Promise<void>;
  clearCanvas: () => void;
}

interface WhiteboardCanvasProps {
  initialElements: any[];
  initialAppState?: any;
  onChange: (elements: any[], appState: any) => void;
}

export const WhiteboardCanvas = forwardRef<WhiteboardCanvasRef, WhiteboardCanvasProps>(
  ({ initialElements, initialAppState, onChange }, ref) => {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const elementsRef = useRef<any[]>(initialElements);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync when initialElements changes (switching whiteboards)
    useEffect(() => {
      elementsRef.current = initialElements;
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements: initialElements || [],
          appState: initialAppState || {},
        });
      }
    }, [initialElements, initialAppState, excalidrawAPI]);

    // Handle scene changes with debounce for autosave
    const handleChange = (elements: readonly any[], appState: any) => {
      elementsRef.current = [...elements];

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        onChange([...elements], appState);
      }, 1200);
    };

    useImperativeHandle(ref, () => ({
      addStickyNote: (color: string) => {
        if (!excalidrawAPI) return;

        const currentElements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();

        // Calculate center of current viewport
        const centerX = (appState.width / 2 - appState.offsetLeft) / appState.zoom.value - appState.scrollX;
        const centerY = (appState.height / 2 - appState.offsetTop) / appState.zoom.value - appState.scrollY;

        const timestamp = Date.now();
        const rectId = `sticky_rect_${timestamp}`;
        const textId = `sticky_text_${timestamp}`;

        const stickyRect = {
          id: rectId,
          type: "rectangle",
          x: centerX - 80,
          y: centerY - 80,
          width: 160,
          height: 160,
          angle: 0,
          strokeColor: "transparent",
          backgroundColor: color,
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          groupIds: [],
          frameId: null,
          roundness: { type: 3 },
          seed: Math.floor(Math.random() * 1000000),
          version: 1,
          versionNonce: Math.floor(Math.random() * 1000000),
          isDeleted: false,
          boundElements: [{ id: textId, type: "text" }],
          updated: timestamp,
          link: null,
          locked: false,
        };

        const stickyText = {
          id: textId,
          type: "text",
          x: centerX - 60,
          y: centerY - 20,
          width: 120,
          height: 40,
          angle: 0,
          strokeColor: "#1e293b",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: Math.floor(Math.random() * 1000000),
          version: 1,
          versionNonce: Math.floor(Math.random() * 1000000),
          isDeleted: false,
          boundElements: null,
          updated: timestamp,
          link: null,
          locked: false,
          text: "Sticky Note",
          fontSize: 18,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          containerId: rectId,
          originalText: "Sticky Note",
          lineHeight: 1.25,
          baseline: 18,
        };

        const updatedElements = [...currentElements, stickyRect, stickyText];
        excalidrawAPI.updateScene({ elements: updatedElements });
        onChange(updatedElements, appState);
      },

      addDiagramElements: (newElements: any[]) => {
        if (!excalidrawAPI) return;
        const currentElements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const updatedElements = [...currentElements, ...newElements];
        excalidrawAPI.updateScene({ elements: updatedElements });
        excalidrawAPI.scrollToContent(newElements, { fitToViewport: true });
        onChange(updatedElements, appState);
      },

      exportPng: async (fileName: string) => {
        if (!excalidrawAPI) return;

        try {
          const { exportToBlob } = await import("@excalidraw/excalidraw");
          const elements = excalidrawAPI.getSceneElements();
          const appState = excalidrawAPI.getAppState();
          const files = excalidrawAPI.getFiles();

          const blob = await exportToBlob({
            elements,
            appState: {
              ...appState,
              exportWithBackground: true,
            },
            files,
            mimeType: "image/png",
          });

          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName || "Whiteboard"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error("Failed to export PNG:", err);
        }
      },

      clearCanvas: () => {
        if (!excalidrawAPI) return;
        excalidrawAPI.updateScene({ elements: [] });
        onChange([], excalidrawAPI.getAppState());
      },
    }));

    return (
      <div className="w-full h-full relative overflow-hidden bg-slate-50">
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          initialData={{
            elements: initialElements || [],
            appState: {
              viewBackgroundColor: "#ffffff",
              currentItemStrokeColor: "#1e293b",
              currentItemBackgroundColor: "transparent",
              currentItemFillStyle: "solid",
              currentItemStrokeWidth: 2,
              currentItemRoughness: 1,
              currentItemFontFamily: 1,
              ...initialAppState,
            },
          }}
          onChange={handleChange}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              loadScene: true,
              saveToActiveFile: true,
              toggleTheme: true,
              saveAsImage: true,
            },
          }}
        />
      </div>
    );
  }
);

WhiteboardCanvas.displayName = "WhiteboardCanvas";
