"use client";

import { useState, useTransition, useEffect } from "react";
import { MessageSquare, Send, Trash2, X, Clock } from "lucide-react";
import { getPageComments, addPageComment, deletePageComment } from "@/app/spaces/actions";

interface CommentData {
  id: number;
  pageId: number;
  clerkUserId: string;
  content: string;
  createdAt: Date | string;
}

function formatTimeAgo(date: Date | string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

interface Props {
  pageId: number;
  pageName: string;
  onClose: () => void;
  onCommentsCountChange: (count: number) => void;
}

export function PageCommentsPanel({ pageId, pageName, onClose, onCommentsCountChange }: Props) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getPageComments(pageId).then((data) => {
      setComments(data as CommentData[]);
      setLoading(false);
    });
  }, [pageId]);

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;
    setError("");

    startTransition(async () => {
      try {
        const res = await addPageComment(pageId, cleanText);
        setComments((prev) => [res as CommentData, ...prev]);
        setText("");
        onCommentsCountChange(res.commentsCount);
      } catch (err: any) {
        setError(err.message || "Failed to add comment.");
      }
    });
  }

  function handleDeleteComment(commentId: number) {
    startTransition(async () => {
      try {
        const res = await deletePageComment(commentId, pageId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentsCountChange(res.commentsCount);
      } catch (err: any) {
        setError(err.message || "Failed to delete comment.");
      }
    });
  }

  return (
    <div className="flex flex-col h-full rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-xl bg-violet-100 text-violet-600">
            <MessageSquare className="size-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">Comments</h3>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{pageName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading comments…</div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <MessageSquare className="size-8 text-slate-200" />
            <p className="text-xs font-semibold text-slate-500">No comments yet</p>
            <p className="text-[11px] text-slate-400">Start the conversation below</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="group flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid size-5 place-items-center rounded-full bg-violet-200 text-violet-700 text-[9px] font-bold">
                    {comment.clerkUserId.slice(-2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 text-[11px]">
                    User {comment.clerkUserId.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="size-3" />
                  {formatTimeAgo(comment.createdAt)}
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={isPending}
                    className="ml-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                    title="Delete comment"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed text-[12px] pl-7 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-5">
          <p className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs text-rose-600 font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Comment Input */}
      <form onSubmit={handleAddComment} className="border-t border-slate-100 p-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="grid size-9 place-items-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
