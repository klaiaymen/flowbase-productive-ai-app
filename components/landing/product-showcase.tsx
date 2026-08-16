"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  NotebookPen,
  ClipboardList,
  Palette,
  Bot,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-sky-500" },
  { id: "notes", label: "Notes Editor", icon: NotebookPen, color: "text-rose-500" },
  { id: "kanban", label: "Kanban Board", icon: ClipboardList, color: "text-amber-500" },
  { id: "whiteboard", label: "Whiteboard", icon: Palette, color: "text-emerald-500" },
  { id: "assistant", label: "AI Assistant", icon: Bot, color: "text-cyan-500" },
];

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <section id="showcase" className="py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            Interactive Product Tour
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            See Flowbase in Action
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            Switch between core views to experience how Flowbase unifies your daily workflow.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-white" : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Mockup Container */}
        <div className="rounded-[2.5rem] border border-white/90 bg-white/90 p-4 md:p-6 shadow-xl backdrop-blur-2xl max-w-5xl mx-auto">
          <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50/60 overflow-hidden min-h-[420px] flex flex-col justify-between">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/70 bg-white px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-rose-400" />
                <span className="size-3 rounded-full bg-amber-400" />
                <span className="size-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-extrabold text-slate-900 capitalize">
                  Flowbase / {activeTab}
                </span>
              </div>
              <span className="rounded-full bg-cyan-100 text-cyan-800 px-3 py-0.5 text-[10px] font-bold">
                Real App Mode
              </span>
            </div>

            {/* Dynamic View Content */}
            <div className="p-6 flex-1">
              {activeTab === "dashboard" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-950">Good morning, Product Team 👋</h3>
                      <p className="text-xs text-slate-500">Your workspace is active. 3 tasks due today.</p>
                    </div>
                    <span className="rounded-xl bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                      78% Completion Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Open Tasks</p>
                      <p className="text-2xl font-black text-slate-900">14</p>
                      <p className="text-xs text-amber-600 font-semibold">4 high priority</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Active Notes</p>
                      <p className="text-2xl font-black text-slate-900">28</p>
                      <p className="text-xs text-rose-600 font-semibold">6 pinned docs</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">AI Mini Apps</p>
                      <p className="text-2xl font-black text-slate-900">5</p>
                      <p className="text-xs text-fuchsia-600 font-semibold">Ready to use</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-4 animate-fade-in bg-white p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xl font-black text-slate-950">📝 Q3 Product Strategy & Roadmap</h3>
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                      Pinned Note
                    </span>
                  </div>
                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
                    <p><strong>1. Executive Summary:</strong> Unify living documents and whiteboard sketches into a single AI canvas.</p>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60 font-mono text-[11px] text-violet-700">
                      /ai refine → "Improve tone and summarize action items"
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Launch live cursor multiplayer via Liveblocks</li>
                      <li>Integrate Groq Llama 3.3 for conversational task commands</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "kanban" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-slate-500">Todo</span>
                      <span className="size-5 rounded-full bg-slate-100 text-xs font-bold grid place-items-center">2</span>
                    </div>
                    <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs font-bold text-slate-800">
                      Design System Refresh
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-sky-600">In Progress</span>
                      <span className="size-5 rounded-full bg-sky-100 text-xs font-bold text-sky-800 grid place-items-center">3</span>
                    </div>
                    <div className="rounded-xl bg-sky-50/80 border border-sky-200 p-3 text-xs font-bold text-slate-800">
                      Connect AssemblyAI Voice Hook
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-emerald-600">Done</span>
                      <span className="size-5 rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 grid place-items-center">5</span>
                    </div>
                    <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3 text-xs font-bold text-slate-800">
                      Setup Neon Postgres Database
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "whiteboard" && (
                <div className="rounded-2xl bg-white p-6 border border-slate-200/80 min-h-[220px] relative overflow-hidden flex items-center justify-center animate-fade-in">
                  <div className="absolute left-8 top-8 size-20 rounded-2xl bg-emerald-100/80 border border-emerald-300 shadow-sm flex items-center justify-center font-bold text-xs text-emerald-800">
                    User Flow
                  </div>
                  <div className="absolute right-12 bottom-8 size-24 rounded-full bg-sky-100/80 border border-sky-300 shadow-sm flex items-center justify-center font-bold text-xs text-sky-800">
                    AI Agent
                  </div>
                  <div className="text-center space-y-1 z-10">
                    <Palette className="mx-auto size-8 text-emerald-500" />
                    <p className="text-sm font-bold text-slate-900">Infinite Excalidraw Spatial Canvas</p>
                    <p className="text-xs text-slate-500">Draw diagrams, flowcharts, and mind maps</p>
                  </div>
                </div>
              )}

              {activeTab === "assistant" && (
                <div className="space-y-4 animate-fade-in bg-white p-6 rounded-2xl border border-cyan-200">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-cyan-500 text-white grid place-items-center font-bold">
                      <Bot className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Flowbase AI Assistant</p>
                      <p className="text-[10px] text-slate-400">Powered by Groq Llama 3.3</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-cyan-50 p-3 text-xs font-medium text-cyan-900 border border-cyan-100">
                    "I created a task named 'Prepare Launch Presentation' in your Work Kanban board for tomorrow."
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-200/70 bg-white px-6 py-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Experience full capabilities inside Flowbase</span>
              <a href="#pricing" className="text-cyan-600 font-bold hover:underline flex items-center gap-1">
                Explore Plans
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
