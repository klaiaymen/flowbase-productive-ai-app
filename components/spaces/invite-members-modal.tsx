"use client";

import { useState, useTransition, useEffect } from "react";
import { X, UserPlus, Mail, Trash2, CheckCircle, Clock } from "lucide-react";
import { getSpaceMembers, addSpaceMember, removeSpaceMember } from "@/app/spaces/actions";

interface Member {
  id: number;
  email: string;
  hasAccount: boolean;
  userName: string | null;
  createdAt: Date;
}

interface Props {
  spaceId: number;
  spaceName: string;
  onClose: () => void;
}

export function InviteMembersModal({ spaceId, spaceName, onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getSpaceMembers(spaceId).then((m) => {
      setMembers(m as Member[]);
      setLoading(false);
    });
  }, [spaceId]);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(""); setSuccess("");

    startTransition(async () => {
      try {
        const newMember = await addSpaceMember(spaceId, email);
        setMembers((prev) => [...prev, newMember as Member]);
        setEmail("");
        setSuccess(`${email} has been added as a collaborator.`);
      } catch (err: any) {
        setError(err.message || "Failed to add collaborator.");
      }
    });
  }

  function handleRemove(memberId: number) {
    startTransition(async () => {
      try {
        await removeSpaceMember(spaceId, memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } catch (err: any) {
        setError(err.message || "Failed to remove collaborator.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white shadow-[0_32px_80px_rgba(109,40,217,0.15)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-lg">
              <UserPlus className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Invite Collaborators</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{spaceName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Email Input */}
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className="h-10 rounded-xl px-4 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              Invite
            </button>
          </form>

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>}
          {success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 flex items-center gap-1.5"><CheckCircle className="size-3.5" />{success}</p>}

          {/* Note about how sharing works */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
            <p className="text-xs text-violet-700 leading-relaxed">
              <strong>How it works:</strong> When you add an email, that person can access this space the next time they sign in to Flowbase with that email address.
            </p>
          </div>

          {/* Members List */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Current Collaborators {members.length > 0 && <span className="text-slate-400 font-normal">({members.length})</span>}
            </p>
            {loading ? (
              <div className="text-center py-6 text-sm text-slate-400">Loading…</div>
            ) : members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center">
                <p className="text-sm text-slate-400">No collaborators yet</p>
                <p className="text-xs text-slate-300 mt-0.5">Invite by email above</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                        {(m.userName || m.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {m.userName && <p className="text-xs font-semibold text-slate-800 truncate">{m.userName}</p>}
                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                      </div>
                      {m.hasAccount ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle className="size-3" /> Active
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Clock className="size-3" /> Pending
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(m.id)}
                      disabled={isPending}
                      className="ml-2 shrink-0 grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-40"
                      title="Remove collaborator"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
