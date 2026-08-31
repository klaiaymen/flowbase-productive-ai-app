"use client";

import React from "react";
import { useOthers } from "@liveblocks/react";

const CURSOR_COLORS = [
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#3b82f6", // Blue
  "#d946ef", // Fuchsia
];

export function LiveCursors() {
  const others = useOthers();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {others.map(({ connectionId, presence, info }) => {
        if (!presence || !(presence as any).cursor) return null;

        const cursor = (presence as any).cursor as { x: number; y: number };
        const color = CURSOR_COLORS[connectionId % CURSOR_COLORS.length];
        const name = (info as any)?.name || (presence as any)?.name || `Collaborator ${connectionId}`;

        return (
          <div
            key={connectionId}
            className="absolute top-0 left-0 transition-transform duration-75 ease-out flex items-start gap-1"
            style={{
              transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
            }}
          >
            {/* Custom Mouse Cursor SVG */}
            <svg
              className="size-5 shrink-0 filter drop-shadow-md"
              style={{ color }}
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M5.653 3.123A1.5 1.5 0 0 0 3.2 4.417V19.4a1.5 1.5 0 0 0 2.502 1.115l3.86-3.377a1.5 1.5 0 0 1 .986-.367h6.638a1.5 1.5 0 0 0 1.077-2.545L5.653 3.123z" />
            </svg>

            {/* User Name Badge */}
            <div
              className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-md whitespace-nowrap opacity-90 backdrop-blur-xs select-none"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
