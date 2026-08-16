"use client";

import { Users, MessageSquare, ShieldCheck, Zap, Layers, CheckCircle2 } from "lucide-react";

export function CollaborationSection() {
  return (
    <section id="collaboration" className="py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3.5 py-1 text-xs font-bold text-violet-800 border border-violet-200">
            <Zap className="size-3.5" />
            Liveblocks Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Real-Time Multiplayer Collaboration
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            Eliminate silos. Work on the same boards, documents, and whiteboards simultaneously with instant team presence.
          </p>
        </div>

        {/* 4 Feature Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-[2rem] border border-violet-200/80 bg-white/90 p-6 shadow-xs backdrop-blur-xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 font-bold">
              <Users className="size-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-950">Active User Presence</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              See live multiplayer cursors, user avatars, and current active focus areas across documents.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-200/80 bg-white/90 p-6 shadow-xs backdrop-blur-xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 font-bold">
              <Layers className="size-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-950">Shared Kanban Boards</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Invite team members via email to collaborate on project boards with real-time column updates.
            </p>
          </div>

          <div className="rounded-[2rem] border border-cyan-200/80 bg-white/90 p-6 shadow-xs backdrop-blur-xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 font-bold">
              <MessageSquare className="size-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-950">Live Task & Page Comments</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Leave contextual comment threads on pages and tasks to discuss feedback directly where work happens.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-200/80 bg-white/90 p-6 shadow-xs backdrop-blur-xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 font-bold">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-950">Team Workspace Roles</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Assign RBAC roles (Superuser, PMO, Chef de Projet, Member) to control workspace administration.
            </p>
          </div>
        </div>

        {/* Live Multiplayer Banner Mockup */}
        <div className="rounded-[2.5rem] border border-violet-200 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                Powered by Liveblocks WebSocket Sync
              </span>
              <h3 className="text-2xl font-black">Experience zero-latency team synergy</h3>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                Changes stream instantly across browsers. No refresh required.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="flex -space-x-2">
                <span className="size-8 rounded-full bg-emerald-400 text-slate-900 font-bold text-xs grid place-items-center ring-2 ring-white">
                  JD
                </span>
                <span className="size-8 rounded-full bg-amber-400 text-slate-900 font-bold text-xs grid place-items-center ring-2 ring-white">
                  SK
                </span>
                <span className="size-8 rounded-full bg-fuchsia-400 text-slate-900 font-bold text-xs grid place-items-center ring-2 ring-white">
                  AL
                </span>
              </div>
              <span className="text-xs font-bold text-white px-2">3 users online now</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
