"use client";

import {
  Sparkles,
  Bot,
  CalendarPlus,
  FileCheck2,
  Palette,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Mic,
} from "lucide-react";

const AI_CAPABILITIES = [
  {
    icon: Bot,
    title: "Conversational Task Execution",
    description: "Tell AI to 'Add a task for tomorrow' and it identifies the right board, sets priorities, and confirms execution.",
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10 border-cyan-200",
  },
  {
    icon: CalendarPlus,
    title: "Calendar Reminder Scheduling",
    description: "Schedule sync meetings and reminders via natural language or voice prompts without touching manual date pickers.",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10 border-orange-200",
  },
  {
    icon: FileCheck2,
    title: "Smart Note Refinement",
    description: "Rephrase, expand, simplify, or fix grammar in your Tiptap living documents with instant AI context actions.",
    color: "text-rose-600",
    bgColor: "bg-rose-500/10 border-rose-200",
  },
  {
    icon: Palette,
    title: "Diagram & Visual Prompts",
    description: "Generate structured flowchart ideas, mind maps, and layout blueprints directly onto your spatial whiteboard canvas.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10 border-emerald-200",
  },
  {
    icon: Sparkles,
    title: "AI Template Builder",
    description: "Prompt the AI to build custom single-page mini apps complete with stats grid, progress trackers, and data tables.",
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-500/10 border-fuchsia-200",
  },
  {
    icon: TrendingUp,
    title: "Automated Productivity Insights",
    description: "Receive daily AI insights on overdue tasks, your most active workspace areas, and suggested focus priorities.",
    color: "text-violet-600",
    bgColor: "bg-violet-500/10 border-violet-200",
  },
];

export function AiFeaturesSection() {
  return (
    <section id="ai-features" className="py-20 relative bg-gradient-to-b from-transparent via-cyan-50/40 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
            <Cpu className="size-3.5" />
            Groq Llama 3.3 Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            AI Built Directly Into Every Layer
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            Not just a side chatbot — Flowbase AI understands your full workspace context and acts on your command.
          </p>
        </div>

        {/* AI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className={`rounded-[2rem] border p-6 shadow-xs backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-md ${cap.bgColor}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex size-11 items-center justify-center rounded-2xl bg-white shadow-xs ${cap.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200/60">
                    Groq AI
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-950 mb-2">{cap.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{cap.description}</p>
              </div>
            );
          })}
        </div>

        {/* AssemblyAI Voice Highlight Bar */}
        <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50/80 via-white to-orange-50/80 p-6 md:p-8 shadow-sm backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-500/20 shrink-0">
              <Mic className="size-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-950">AssemblyAI Real-Time Voice Assistant</h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Speak directly to your workspace with live streaming speech-to-text transcription.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 border border-rose-200">
              Voice Agent Enabled
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
