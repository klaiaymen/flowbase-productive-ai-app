"use client";

import {
  Bot,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  NotebookPen,
  Palette,
  Sparkles,
  Users,
  Settings,
} from "lucide-react";

const FEATURES = [
  {
    icon: Bot,
    title: "AI Assistant",
    description: "Conversational command center powered by Groq. Ask questions, schedule tasks, create notes, and execute workspace actions via voice or chat.",
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10 border-cyan-200/80 hover:bg-cyan-500/15",
    iconBg: "bg-cyan-100 text-cyan-600",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description: "Get a live overview of your productivity momentum, upcoming reminders, recent pages, and automated AI activity insights.",
    color: "text-sky-600",
    bgColor: "bg-sky-500/10 border-sky-200/80 hover:bg-sky-500/15",
    iconBg: "bg-sky-100 text-sky-600",
  },
  {
    icon: CalendarDays,
    title: "Calendar & Reminders",
    description: "Organize tasks and events with smart category colors (work, learning, urgent, ideas, personal) and drag-and-drop scheduling.",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10 border-orange-200/80 hover:bg-orange-500/15",
    iconBg: "bg-orange-100 text-orange-600",
  },
  {
    icon: ClipboardList,
    title: "Kanban / Task Boards",
    description: "Manage project workflows with customizable columns, priority tags, task assignees, and automatic calendar synchronization.",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10 border-amber-200/80 hover:bg-amber-500/15",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    icon: NotebookPen,
    title: "Notion-Style Notes",
    description: "Tiptap rich-text living docs with slash commands, AI grammar refinement, task lists, and color-coded note pins.",
    color: "text-rose-600",
    bgColor: "bg-rose-500/10 border-rose-200/80 hover:bg-rose-500/15",
    iconBg: "bg-rose-100 text-rose-600",
  },
  {
    icon: Palette,
    title: "Miro-Style Whiteboard",
    description: "Infinite spatial canvas powered by Excalidraw for sketching architecture diagrams, wireframes, sticky notes, and mind maps.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10 border-emerald-200/80 hover:bg-emerald-500/15",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Sparkles,
    title: "AI Template Builder",
    description: "Prompt the AI to instantly generate custom single-page mini applications, layout schemas, trackers, and checklists.",
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-500/10 border-fuchsia-200/80 hover:bg-fuchsia-500/15",
    iconBg: "bg-fuchsia-100 text-fuchsia-600",
  },
  {
    icon: Users,
    title: "Live Collaboration",
    description: "Real-time multiplayer powered by Liveblocks — active user presence cursors, shared boards, and page comments.",
    color: "text-violet-600",
    bgColor: "bg-violet-500/10 border-violet-200/80 hover:bg-violet-500/15",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    icon: Settings,
    title: "Settings & RBAC Roles",
    description: "Enterprise user management with Superuser, PMO, Chef de Projet, and Member roles to scope team permissions.",
    color: "text-slate-600",
    bgColor: "bg-slate-500/10 border-slate-200/80 hover:bg-slate-500/15",
    iconBg: "bg-slate-100 text-slate-700",
  },
];

export function FeatureSection() {
  return (
    <section id="features" className="py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
            Comprehensive Suite
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Everything You Need in One Connected Workspace
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            Replace 6 different subscription apps with one unified, cozy AI platform built for deep focus and smooth team execution.
          </p>
        </div>

        {/* 9 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className={`group rounded-[1.75rem] border p-6 shadow-xs backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feat.bgColor}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex size-11 items-center justify-center rounded-2xl ${feat.iconBg} shadow-xs group-hover:scale-110 transition-transform`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Flowbase Core</span>
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
