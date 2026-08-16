"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Play,
  Bot,
  Users,
  CheckCircle2,
  CalendarDays,
  ClipboardList,
  NotebookPen,
  Palette,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background glowing gradient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-300/30 via-violet-300/30 to-fuchsia-300/30 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-4 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md transition-all hover:border-cyan-300">
            <span className="flex size-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="bg-gradient-to-r from-cyan-600 to-violet-600 bg-clip-text text-transparent">
              Introducing Flowbase v2.0
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-semibold">Groq AI & Liveblocks Powered</span>
            <ArrowRight className="size-3.5 text-cyan-600" />
          </div>
        </div>

        {/* Hero Main Headline */}
        <div className="mt-8 text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Your AI-Powered Workspace for{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              Notes, Tasks, Whiteboards
            </span>{" "}
            and Collaboration
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Flowbase combines Notion-style living docs, Miro-style visual whiteboards, Kanban project boards, intelligent calendar rhythm, and Groq-powered AI assistance into one seamless platform.
          </p>

          {/* CTA Button Group */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/sign-up">
              <Button className="h-12 px-7 rounded-2xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white font-bold text-sm shadow-xl shadow-cyan-200/60 hover:from-cyan-600 hover:via-violet-600 hover:to-fuchsia-600 transition-all hover:-translate-y-0.5">
                <Sparkles className="mr-2 size-4" />
                Get Started for Free
              </Button>
            </Link>

            <a href="#showcase">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-2xl border-slate-200/90 bg-white/90 text-slate-700 font-bold text-sm shadow-xs hover:bg-slate-50 transition-all"
              >
                <Play className="mr-2 size-4 text-cyan-600 fill-cyan-600" />
                Watch Demo
              </Button>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-slate-200/70 px-3 py-1.5 shadow-xs">
              <Bot className="size-3.5 text-cyan-500" />
              Groq AI Assistant
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-slate-200/70 px-3 py-1.5 shadow-xs">
              <Zap className="size-3.5 text-amber-500" />
              Liveblocks Real-Time
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-slate-200/70 px-3 py-1.5 shadow-xs">
              <Palette className="size-3.5 text-emerald-500" />
              Spatial Whiteboard
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-slate-200/70 px-3 py-1.5 shadow-xs">
              <CalendarDays className="size-3.5 text-orange-500" />
              Smart Calendar
            </span>
          </div>
        </div>

        {/* Hero Dashboard Interactive Frame Preview */}
        <div className="mt-14 relative mx-auto max-w-5xl">
          {/* Glass Card Container */}
          <div className="rounded-[2.5rem] border border-white/90 bg-white/85 p-3 md:p-5 shadow-[0_30px_90px_rgba(47,75,107,0.12)] backdrop-blur-2xl">
            <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50/50 overflow-hidden shadow-inner">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-rose-400" />
                  <span className="size-3 rounded-full bg-amber-400" />
                  <span className="size-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-bold text-slate-400">Flowbase Workspace — Active Session</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 border border-emerald-200">
                    Live Syncing
                  </span>
                </div>
              </div>

              {/* Window Content Preview Grid */}
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left Card: Focus Board */}
                <div className="rounded-2xl border border-white/90 bg-white/90 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <ClipboardList className="size-4 text-amber-500" />
                      Kanban Priorities
                    </span>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                      3 Active
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Launch Product MVP</span>
                      <span className="size-2 rounded-full bg-rose-500" />
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Review AI Prompts</span>
                      <span className="size-2 rounded-full bg-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Center Card: AI Assistant Output */}
                <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/90 to-violet-50/90 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Bot className="size-4 text-cyan-600" />
                      Groq AI Assistant
                    </span>
                    <span className="rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5">
                      Online
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/90 p-3 text-xs text-slate-700 shadow-xs border border-white space-y-1.5">
                    <p className="font-bold text-cyan-800">"Create a task for tomorrow at 3 PM"</p>
                    <p className="text-[11px] text-slate-500">✅ Scheduled event added to Calendar and Kanban Todo column.</p>
                  </div>
                </div>

                {/* Right Card: Spatial Whiteboard Pulse */}
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Palette className="size-4 text-emerald-600" />
                      Spatial Sketches
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                      Excalidraw
                    </span>
                  </div>
                  <div className="h-20 rounded-xl border border-dashed border-emerald-200 bg-white/80 p-2 relative flex items-center justify-center">
                    <div className="absolute left-3 top-3 size-6 rounded-lg bg-sky-200/80 border border-sky-300" />
                    <div className="absolute right-4 bottom-3 size-8 rounded-full bg-amber-200/80 border border-amber-300" />
                    <span className="text-[11px] font-bold text-slate-500 z-10">System Flow Diagram</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="hidden lg:flex absolute -left-8 top-1/3 rounded-2xl border border-white/90 bg-white/90 p-3.5 shadow-xl backdrop-blur-xl items-center gap-3 animate-bounce-slow">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 font-bold">
              <NotebookPen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Notion-Style Docs</p>
              <p className="text-[10px] font-medium text-slate-500">Tiptap rich text + slash actions</p>
            </div>
          </div>

          <div className="hidden lg:flex absolute -right-8 bottom-1/4 rounded-2xl border border-white/90 bg-white/90 p-3.5 shadow-xl backdrop-blur-xl items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600 font-bold">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">AI Template Builder</p>
              <p className="text-[10px] font-medium text-slate-500">Generate mini web apps in seconds</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
