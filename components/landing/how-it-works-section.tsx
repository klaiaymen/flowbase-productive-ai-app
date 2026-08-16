"use client";

import { Layers, Bot, Users, CheckCircle2, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Layers,
    title: "Organize Your Workspace",
    description: "Create living docs, setup Kanban project boards, and organize your calendar schedule in a clean, cozy layout.",
    color: "from-cyan-500 to-sky-500",
    badgeBg: "bg-cyan-100 text-cyan-800",
  },
  {
    step: "02",
    icon: Bot,
    title: "Let AI Help You Plan & Create",
    description: "Use Groq AI or voice prompts to schedule tasks, generate mini app templates, refine note text, and extract key action items.",
    color: "from-violet-500 to-fuchsia-500",
    badgeBg: "bg-violet-100 text-violet-800",
  },
  {
    step: "03",
    icon: Users,
    title: "Collaborate & Track Progress",
    description: "Invite team members with Liveblocks presence cursors, share board permissions, comment on pages, and view dashboard progress metrics.",
    color: "from-emerald-500 to-teal-500",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 relative bg-slate-900/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3.5 py-1 text-xs font-bold text-violet-800 border border-violet-200">
            Simple 3-Step Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            How Flowbase Simplifies Your Daily Flow
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            From quick capture to execution, Flowbase guides your momentum with calm structure and intelligent automation.
          </p>
        </div>

        {/* 3 Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((s, index) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative rounded-[2rem] border border-white/90 bg-white/90 p-8 shadow-sm backdrop-blur-xl space-y-5 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full ${s.badgeBg} px-3 py-1 text-xs font-extrabold`}>
                    Step {s.step}
                  </span>
                  <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-md`}>
                    <Icon className="size-6" />
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-slate-950">{s.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{s.description}</p>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Instant Setup</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
