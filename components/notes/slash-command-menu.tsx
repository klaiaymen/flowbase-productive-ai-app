"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  {
    id: "paragraph",
    label: "Text",
    description: "Plain paragraph",
    icon: Type,
    action: (editor: Editor) =>
      editor.chain().focus().deleteRange(getSlashRange(editor)).setParagraph().run(),
  },
  {
    id: "h1",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    action: (editor: Editor) =>
      editor
        .chain()
        .focus()
        .deleteRange(getSlashRange(editor))
        .setHeading({ level: 1 })
        .run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    action: (editor: Editor) =>
      editor
        .chain()
        .focus()
        .deleteRange(getSlashRange(editor))
        .setHeading({ level: 2 })
        .run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    action: (editor: Editor) =>
      editor
        .chain()
        .focus()
        .deleteRange(getSlashRange(editor))
        .setHeading({ level: 3 })
        .run(),
  },
  {
    id: "bullet-list",
    label: "Bullet List",
    description: "Unordered list",
    icon: List,
    action: (editor: Editor) =>
      editor.chain().focus().deleteRange(getSlashRange(editor)).toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    label: "Ordered List",
    description: "Numbered list",
    icon: ListOrdered,
    action: (editor: Editor) =>
      editor.chain().focus().deleteRange(getSlashRange(editor)).toggleOrderedList().run(),
  },
  {
    id: "task-list",
    label: "Task List",
    description: "Checkable to-do items",
    icon: CheckSquare,
    action: (editor: Editor) =>
      editor.chain().focus().deleteRange(getSlashRange(editor)).toggleTaskList().run(),
  },
  {
    id: "blockquote",
    label: "Blockquote",
    description: "Highlighted quote",
    icon: Quote,
    action: (editor: Editor) =>
      editor.chain().focus().deleteRange(getSlashRange(editor)).toggleBlockquote().run(),
  },
  {
    id: "code-block",
    label: "Code Block",
    description: "Multi-line code snippet",
    icon: Code,
    action: (editor: Editor) =>
      editor.chain().focus().deleteRange(getSlashRange(editor)).toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal separator",
    icon: Minus,
    action: (editor: Editor) =>
      editor.chain().focus().deleteRange(getSlashRange(editor)).setHorizontalRule().run(),
  },
];

function getSlashRange(editor: Editor) {
  const { from } = editor.state.selection;
  // Find the slash character before cursor
  const $from = editor.state.selection.$from;
  const textBefore = $from.nodeBefore?.text ?? "";
  const slashIndex = textBefore.lastIndexOf("/");
  if (slashIndex === -1) return { from, to: from };
  const start = from - (textBefore.length - slashIndex);
  return { from: start, to: from };
}

interface SlashCommandMenuProps {
  editor: Editor;
  position: { top: number; left: number };
  onClose: () => void;
}

export function SlashCommandMenu({ editor, position, onClose }: SlashCommandMenuProps) {
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selected]) {
          filtered[selected].action(editor);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Backspace") {
        setQuery((q) => q.slice(0, -1));
      } else if (e.key.length === 1) {
        setQuery((q) => q + e.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selected, editor, onClose]);

  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      id="slash-command-menu"
      className="absolute z-50 min-w-[220px] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {query ? `Matching "${query}"` : "Insert block"}
      </div>
      {filtered.map((cmd, i) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.id}
            id={`slash-cmd-${cmd.id}`}
            onClick={() => {
              cmd.action(editor);
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-left transition",
              i === selected ? "bg-rose-50" : "hover:bg-slate-50"
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-lg border",
                i === selected
                  ? "border-rose-200 bg-rose-100 text-rose-600"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div>
              <p className="text-[12px] font-semibold text-slate-800">{cmd.label}</p>
              <p className="text-[10px] text-slate-400">{cmd.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
