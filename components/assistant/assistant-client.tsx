"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Square,
  Sparkles,
  CalendarPlus,
  NotebookPen,
  ClipboardList,
  Palette,
  LayoutTemplate,
  Calendar,
  Trash2,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssemblyAlStreaming } from "@/hooks/use-assemblyai-streaming";

// ─── Server actions ──────────────────────────────────────────────────────────
import { getBoards, createBoard, saveTask } from "@/app/kanban/actions";
import { saveCalendarItem } from "@/app/calendar/actions";
import { createNote, getNotes } from "@/app/notes/actions";
import { createWhiteboard } from "@/app/whiteboard/actions";
import { getAiTemplates } from "@/app/templates/actions";
import { getWhiteboards } from "@/app/whiteboard/actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  actionResult?: {
    success: boolean;
    label: string;
    href?: string;
  };
  isAction?: boolean;
}

interface AiResponse {
  reply: string;
  action: string | null;
  payload?: Record<string, unknown>;
}

// ─── Suggestion cards data ────────────────────────────────────────────────────

const SUGGESTIONS = [
  {
    icon: ClipboardList,
    color: "text-amber-600",
    bg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
    label: "Create a task for tomorrow",
    prompt: "Create a task for tomorrow",
  },
  {
    icon: CalendarPlus,
    color: "text-orange-600",
    bg: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    label: "Add meeting reminder on calendar",
    prompt: "Add a meeting reminder on my calendar for tomorrow",
  },
  {
    icon: NotebookPen,
    color: "text-rose-600",
    bg: "bg-rose-50 hover:bg-rose-100 border-rose-200",
    label: "Summarize my notes",
    prompt: "Summarize my recent notes and give me a brief overview",
  },
  {
    icon: ClipboardList,
    color: "text-violet-600",
    bg: "bg-violet-50 hover:bg-violet-100 border-violet-200",
    label: "Create a Kanban board",
    prompt: "Create a new Kanban board called 'Product Roadmap'",
  },
  {
    icon: Calendar,
    color: "text-cyan-600",
    bg: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200",
    label: "Plan my week",
    prompt: "Help me plan my week — what should I focus on first?",
  },
  {
    icon: Sparkles,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200",
    label: "Generate a habit tracker template",
    prompt: "Generate an AI template for a daily habit tracker",
  },
];

// ─── Typing dots animation ────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-cyan-400"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AssistantClient() {
  const router = useRouter();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");

  // Workspace context state (loaded once)
  const [boards, setBoards] = useState<Array<{ id: number; name: string; color: string }>>([]);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // ─── Load workspace context once ────────────────────────────────────────────

  useEffect(() => {
    async function loadContext() {
      try {
        const [boardsData] = await Promise.all([getBoards()]);
        setBoards(boardsData);
      } catch (e) {
        console.error("Failed to load workspace context:", e);
      } finally {
        setWorkspaceLoaded(true);
      }
    }
    loadContext();
  }, []);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ─── Auto-resize textarea ────────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [inputValue]);

  // ─── Voice (AssemblyAI) ──────────────────────────────────────────────────────

  const handlePartialTranscript = useCallback((text: string) => {
    setPartialTranscript(text);
    setInputValue(text);
  }, []);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      setPartialTranscript("");
      if (text.trim()) {
        setInputValue(text);
        // Auto-send after a tiny delay so user sees what was transcribed
        setTimeout(() => {
          setInputValue("");
          sendMessage(text);
        }, 400);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boards]
  );

  const handleSessionEnd = useCallback(() => {
    setVoiceError("Voice session ended (2 minute limit). Click mic to start again.");
  }, []);

  const handleVoiceError = useCallback((error: string) => {
    setVoiceError(error);
  }, []);

  const { isRecording, startRecording, stopRecording } = useAssemblyAlStreaming({
    onPartialTranscript: handlePartialTranscript,
    onFinalTranscript: handleFinalTranscript,
    onSessionEnd: handleSessionEnd,
    onError: handleVoiceError,
  });

  const toggleVoice = useCallback(() => {
    setVoiceError(null);
    if (isRecording) {
      stopRecording();
      setPartialTranscript("");
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ─── Build context strings for the AI ────────────────────────────────────────

  function buildBoardsContext() {
    if (boards.length === 0) return "User has no Kanban boards yet.";
    return `User's Kanban boards:\n${boards.map((b) => `- ID: ${b.id}, Name: "${b.name}", Color: ${b.color}`).join("\n")}`;
  }

  function buildWorkspaceContext() {
    return `Boards count: ${boards.length}`;
  }

  // ─── Execute action returned from AI ─────────────────────────────────────────

  async function executeAction(
    action: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; label: string; href?: string }> {
    try {
      switch (action) {
        case "create_task": {
          const { title, boardId, priority, description, dueDate } = payload as {
            title: string;
            boardId: number;
            priority: "low" | "medium" | "high";
            description?: string;
            dueDate?: string;
          };

          // Find board columns
          const { getColumns } = await import("@/app/kanban/actions");
          const cols = await getColumns(boardId);
          if (!cols || cols.length === 0) {
            return { success: false, label: "Board has no columns. Please add columns first." };
          }
          const todoCol = cols.find((c) => c.name.toLowerCase().includes("todo") || c.name.toLowerCase().includes("backlog")) ?? cols[0];

          await saveTask({
            columnId: todoCol.id,
            title: String(title),
            description: description ? String(description) : null,
            dueDate: dueDate ? String(dueDate) : null,
            priority: priority || "medium",
            syncCalendar: false,
            syncNotes: false,
          });

          const boardName = boards.find((b) => b.id === boardId)?.name ?? "your board";
          return { success: true, label: `Task "${title}" created in "${boardName}"`, href: "/kanban" };
        }

        case "create_board": {
          const { name, color } = payload as { name: string; color: string };
          const board = await createBoard(String(name), String(color || "violet"));
          setBoards((prev) => [...prev, board]);
          return { success: true, label: `Board "${name}" created`, href: "/kanban" };
        }

        case "add_calendar_item": {
          const { title, type, category, date, time, description } = payload as {
            title: string;
            type: "task" | "reminder";
            category: string;
            date?: string;
            time?: string;
            description?: string;
          };
          await saveCalendarItem({
            title: String(title),
            type: type || "reminder",
            category: category || "work",
            date: date ? String(date) : null,
            time: time ? String(time) : null,
            description: description ? String(description) : null,
          });
          return { success: true, label: `"${title}" added to your calendar`, href: "/calendar" };
        }

        case "create_note": {
          const { title, content } = payload as { title: string; content?: string };
          const note = await createNote();
          if (title) {
            const { updateNote } = await import("@/app/notes/actions");
            await updateNote(note.id, { title: String(title), content: content ? String(content) : "" });
          }
          return { success: true, label: `Note "${title || "Untitled"}" created`, href: "/notes" };
        }

        case "create_whiteboard": {
          const { name, color } = payload as { name: string; color?: string };
          await createWhiteboard(String(name || "Untitled Whiteboard"), String(color || "emerald"));
          return { success: true, label: `Whiteboard "${name}" created`, href: "/whiteboard" };
        }

        case "generate_template": {
          const { prompt } = payload as { prompt: string };
          const res = await fetch("/api/ai/generate-template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: String(prompt) }),
          });
          if (!res.ok) throw new Error("Template generation failed");
          const { result } = await res.json();
          if (result) {
            const { saveAiTemplate } = await import("@/app/templates/actions");
            const saved = await saveAiTemplate({
              appName: result.appName,
              description: result.description || "",
              icon: result.icon || "Sparkles",
              color: result.color || "#8B5CF6",
              layout: result.layout || "single-page",
              schemaJson: JSON.stringify({ sections: result.sections || [] }),
            });
            return { success: true, label: `AI Template "${result.appName}" generated`, href: `/templates/${saved.id}` };
          }
          return { success: false, label: "Template generation returned no result." };
        }

        case "navigate": {
          const { href } = payload as { href: string };
          router.push(String(href));
          return { success: true, label: `Navigating to ${href}` };
        }

        default:
          return { success: false, label: `Unknown action: ${action}` };
      }
    } catch (err: any) {
      console.error("Action execution failed:", err);
      return { success: false, label: err.message || "Action failed. Please try again." };
    }
  }

  // ─── Send message ─────────────────────────────────────────────────────────────

  async function sendMessage(text?: string) {
    const content = (text ?? inputValue).trim();
    if (!content || isLoading) return;

    setInputValue("");
    setPartialTranscript("");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build conversation history for the API (last 20 messages)
      const history = updatedMessages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          boardsContext: buildBoardsContext(),
          workspaceContext: buildWorkspaceContext(),
        }),
      });

      const aiData: AiResponse = await res.json();

      // Execute action if present
      let actionResult: ChatMessage["actionResult"] | undefined;
      if (aiData.action && aiData.payload) {
        const result = await executeAction(aiData.action, aiData.payload);
        actionResult = result;
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: aiData.reply,
        timestamp: new Date(),
        actionResult,
        isAction: !!aiData.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't reach the AI service. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInputValue("");
    setPartialTranscript("");
  };

  const isEmpty = messages.length === 0;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      {/* Full-height flex layout inside the shell content area */}
      <div className="flex flex-col h-[calc(100vh-48px)] max-h-[calc(100vh-48px)] -mt-2 -mx-2 md:-mx-4 lg:-mx-6">

        {/* ── Header ── */}
        <header className="flex items-center justify-between shrink-0 px-4 md:px-6 py-3 border-b border-white/70 bg-white/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-200/50">
              <Bot className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Flowbase AI Assistant</h1>
              <p className="text-[10px] font-semibold text-slate-400">
                {isRecording ? (
                  <span className="text-rose-500 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                    Listening…
                  </span>
                ) : isLoading ? (
                  <span className="text-cyan-500">Thinking…</span>
                ) : (
                  "Your smart workspace command center"
                )}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-8 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Clear chat
            </Button>
          )}
        </header>

        {/* ── Messages Area ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-5">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center min-h-full py-12 space-y-8 max-w-2xl mx-auto">
              {/* Icon */}
              <div className="relative">
                <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-violet-400 to-fuchsia-500 text-white shadow-xl shadow-cyan-200/60">
                  <Bot className="size-10" />
                </div>
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-md">
                  ✓
                </span>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Flowbase AI Assistant
                </h2>
                <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                  Your smart command center — chat to create tasks, add calendar reminders, write notes, generate templates, and control your entire workspace.
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      onClick={() => {
                        setInputValue(s.prompt);
                        setTimeout(() => sendMessage(s.prompt), 100);
                      }}
                      className={cn(
                        "group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                        s.bg
                      )}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-xs">
                        <Icon className={cn("size-4", s.color)} />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-3xl",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-md shadow-cyan-200/40 mt-0.5">
                  <Bot className="size-4" />
                </div>
              )}
              {msg.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-md mt-0.5">
                  <span className="text-[11px] font-black">You</span>
                </div>
              )}

              <div className="flex flex-col gap-2 max-w-[80%]">
                {/* Bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs",
                    msg.role === "user"
                      ? "bg-gradient-to-br from-cyan-500 to-violet-500 text-white rounded-tr-sm"
                      : "bg-white/90 border border-white/80 text-slate-800 rounded-tl-sm backdrop-blur-md"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Action result card */}
                {msg.actionResult && (
                  <div
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-semibold",
                      msg.actionResult.success
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-rose-200 bg-rose-50 text-rose-800"
                    )}
                  >
                    {msg.actionResult.success ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0 text-rose-500" />
                    )}
                    <span>{msg.actionResult.label}</span>
                    {msg.actionResult.href && msg.actionResult.success && (
                      <Link
                        href={msg.actionResult.href}
                        className="ml-auto flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-emerald-700 hover:bg-emerald-200 transition-colors shrink-0"
                      >
                        View
                        <ArrowUpRight className="size-3" />
                      </Link>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-slate-400 font-medium px-1">
                  {msg.timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 mr-auto max-w-3xl">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-md shadow-cyan-200/40 mt-0.5">
                <Bot className="size-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white/90 border border-white/80 backdrop-blur-md shadow-xs">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Voice error toast ── */}
        {voiceError && (
          <div className="mx-4 md:mx-6 mb-2 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-sm">
            <AlertCircle className="size-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="flex-1">{voiceError}</span>
            <button
              onClick={() => setVoiceError(null)}
              className="text-rose-400 hover:text-rose-700 transition-colors shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* ── Input Panel ── */}
        <div
          ref={inputContainerRef}
          className="shrink-0 px-4 md:px-6 pb-4 pt-2"
        >
          <div className="relative flex items-end gap-2 rounded-[1.5rem] border border-white/80 bg-white/90 p-2 shadow-[0_4px_24px_rgba(52,86,118,0.10)] backdrop-blur-xl">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? "Listening… speak your message"
                  : "Message Flowbase AI… (Shift+Enter for new line)"
              }
              rows={1}
              disabled={isLoading}
              className={cn(
                "flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition-all",
                isRecording && "placeholder:text-rose-400 placeholder:italic"
              )}
              style={{ maxHeight: "160px", overflowY: "auto" }}
            />

            <div className="flex shrink-0 items-center gap-1.5 pb-1 pr-1">
              {/* Voice button */}
              <button
                type="button"
                onClick={toggleVoice}
                title={isRecording ? "Stop recording" : "Start voice input"}
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl transition-all",
                  isRecording
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-300/60 voice-recording-pulse"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                )}
              >
                {isRecording ? (
                  <Square className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </button>

              {/* Send button */}
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl transition-all",
                  inputValue.trim() && !isLoading
                    ? "bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-md shadow-cyan-200/60 hover:from-cyan-600 hover:to-violet-600"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
            AI can create tasks, notes, reminders, whiteboards, and generate templates. Press{" "}
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px]">Enter</kbd>{" "}
            to send.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
