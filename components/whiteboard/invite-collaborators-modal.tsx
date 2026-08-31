"use client";

import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  Loader2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhiteboardShare } from "@/db/schema";
import {
  getWhiteboardCollaborators,
  addWhiteboardCollaborator,
  removeWhiteboardCollaborator,
} from "@/app/whiteboard/actions";

interface InviteCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiteboardId: number;
  whiteboardName: string;
}

export function InviteCollaboratorsModal({
  isOpen,
  onClose,
  whiteboardId,
  whiteboardName,
}: InviteCollaboratorsModalProps) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<WhiteboardShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && whiteboardId) {
      setLoading(true);
      setError(null);
      setSuccess(null);
      getWhiteboardCollaborators(whiteboardId)
        .then((data) => {
          setCollaborators(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load collaborators:", err);
          setLoading(false);
        });
    }
  }, [isOpen, whiteboardId]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const newShare = await addWhiteboardCollaborator(whiteboardId, email.trim());
      setCollaborators((prev) => [newShare, ...prev.filter((c) => c.id !== newShare.id)]);
      setEmail("");
      setSuccess(`Collaborator ${cleanEmailDisplay(email)} added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to invite collaborator.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (shareId: number) => {
    setDeletingId(shareId);
    setError(null);
    try {
      await removeWhiteboardCollaborator(whiteboardId, shareId);
      setCollaborators((prev) => prev.filter((c) => c.id !== shareId));
    } catch (err: any) {
      setError(err.message || "Failed to remove collaborator.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/whiteboard`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function cleanEmailDisplay(emailStr: string) {
    return emailStr.trim().toLowerCase();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Invite Collaborators</h3>
              <p className="text-xs font-medium text-slate-500 truncate max-w-[220px]">
                {whiteboardName}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Add Team Member by Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <Button
                type="submit"
                disabled={inviting || !email.trim()}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs gap-1.5 shrink-0"
              >
                {inviting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="size-3.5" />
                    <span>Invite</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Feedback messages */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <Check className="size-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Collaborator List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3.5 text-slate-400" />
                Active Collaborators ({collaborators.length})
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
              >
                {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                <span>{copied ? "Link Copied!" : "Copy Page Link"}</span>
              </button>
            </div>

            {loading ? (
              <div className="py-6 flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="size-5 animate-spin text-emerald-500" />
                <span className="text-xs">Loading collaborators…</span>
              </div>
            ) : collaborators.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400">
                <p className="text-xs font-medium">No external collaborators invited yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enter an email above to grant live real-time editing access.
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.email)}`}
                        alt={c.email}
                        className="size-7 rounded-full bg-white border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{c.email}</p>
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <ShieldCheck className="size-3" /> Can Edit
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === c.id}
                      onClick={() => handleRemove(c.id)}
                      className="size-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Remove collaborator access"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="size-3.5 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 rounded-xl text-xs font-semibold border-slate-200 text-slate-700"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
