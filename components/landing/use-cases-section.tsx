"use client";

import {
  Rocket,
  GraduationCap,
  Users,
  Sparkles,
  Briefcase,
  UserCheck,
} from "lucide-react";

const USE_CASES = [
  {
    icon: Rocket,
    role: "Founders",
    title: "Sprint from idea to product launch",
    description: "Map product strategy on living docs, brainstorm user journeys on whiteboards, and track dev sprints on Kanban boards.",
    accent: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  {
    icon: GraduationCap,
    role: "Students & Researchers",
    title: "Master courses and research topics",
    description: "Organize subject notes, sketch study flashcards on whiteboards, track exam due dates, and generate revision apps.",
    accent: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    icon: Users,
    role: "Engineering Teams",
    title: "Streamline cross-functional delivery",
    description: "Collaborate in real time with active presence cursors, comment on specs, and assign tasks with automatic calendar sync.",
    accent: "bg-violet-100 text-violet-700 border-violet-200",
  },
  {
    icon: Sparkles,
    role: "Creators & Builders",
    title: "Turn creative concepts into reality",
    description: "Prompt the AI to build custom mini apps, manage editorial calendars, and organize content ideas in one cozy space.",
    accent: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  },
  {
    icon: Briefcase,
    role: "Project Managers",
    title: "Maintain total project clarity",
    description: "Monitor project status indicators (active, on-hold), control user role permissions, and view task completion rates.",
    accent: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    icon: UserCheck,
    role: "Personal Productivity",
    title: "Build consistent daily momentum",
    description: "Track personal habits, schedule calendar reminders, manage living journals, and receive daily AI focus insights.",
    accent: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 relative bg-slate-900/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
            Tailored For You
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Built for Every Workflow Strategy
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            Whether you are building a startup, studying for exams, or managing team sprints, Flowbase adapts to your exact goals.
          </p>
        </div>

        {/* 6 Use Case Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.role}
                className="rounded-[2rem] border border-white/90 bg-white/90 p-6 shadow-sm backdrop-blur-xl space-y-4 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold border ${uc.accent}`}>
                    {uc.role}
                  </span>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="size-5" />
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-950">{uc.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{uc.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
