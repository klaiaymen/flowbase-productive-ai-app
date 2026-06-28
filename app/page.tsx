"use client";

import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Palette,
  Plus,
  Search,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statCards = [
  {
    label: "Open tasks",
    value: "24",
    note: "6 due this week",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    label: "Active spaces",
    value: "08",
    note: "Product, growth, ops",
    accent: "bg-violet-100 text-violet-700",
  },
  {
    label: "AI drafts",
    value: "12",
    note: "Ready to refine",
    accent: "bg-cyan-100 text-cyan-700",
  },
];

const focusItems = [
  "Shape launch board structure",
  "Review meeting notes",
  "Create onboarding template",
];

export default function Home() {
  return (
    <AppShell>
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/90 bg-white/74 p-4 shadow-[0_20px_60px_rgba(52,86,118,0.1)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
            Today in Flowbase
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Build your workspace with calm momentum.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            One cozy place for project boards, living docs, AI templates,
            sketches, and meeting rhythm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-cyan-100 bg-white/85 text-slate-700 hover:bg-cyan-50"
          >
            <Search className="mr-2 size-4 text-sky-500" />
            Search
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-200/70 hover:from-cyan-600 hover:to-violet-600"
          >
            <Plus className="mr-2 size-4" />
            New space
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-white/90 bg-white/78 p-5 shadow-sm backdrop-blur"
          >
            <div
              className={cn(
                "mb-5 inline-flex rounded-full px-3 py-1 text-xs font-bold",
                card.accent,
              )}
            >
              {card.label}
            </div>
            <p className="text-3xl font-bold text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.5rem] border border-white/90 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Focus board
              </h2>
              <p className="text-sm text-muted-foreground">
                Kanban-ready priorities for the next deep work block.
              </p>
            </div>
            <ClipboardList className="size-5 text-amber-500" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {["Backlog", "In progress", "Done"].map((column, index) => (
              <div
                key={column}
                className="min-h-44 rounded-2xl border border-cyan-100/80 bg-white/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {column}
                  </p>
                  <span className="grid size-6 place-items-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
                    {index + 1}
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">
                  {focusItems[index]}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/90 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Whiteboard pulse
              </h2>
              <p className="text-sm text-muted-foreground">
                Fresh sketches and ideas waiting nearby.
              </p>
            </div>
            <Palette className="size-5 text-emerald-500" />
          </div>

          <div className="relative min-h-60 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4">
            <div className="absolute left-6 top-6 h-16 w-28 rounded-2xl border border-sky-200 bg-white/90 shadow-sm" />
            <div className="absolute right-6 top-12 h-14 w-24 rounded-2xl border border-amber-200 bg-amber-100/80 shadow-sm" />
            <div className="absolute bottom-8 left-12 h-14 w-32 rounded-full border border-violet-200 bg-violet-100/80 shadow-sm" />
            <div className="absolute bottom-10 right-10 h-16 w-16 rounded-2xl border border-rose-200 bg-rose-100/80 shadow-sm" />
            <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 rotate-12 bg-slate-300" />
            <div className="absolute left-[42%] top-[38%] h-px w-32 -rotate-[28deg] bg-slate-300" />
          </div>
        </article>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-white/90 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center gap-3">
            <Bot className="size-5 text-cyan-500" />
            <h2 className="text-lg font-bold text-slate-950">
              AI assistant queue
            </h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Draft a sprint brief, turn notes into tasks, and generate a reusable
            project template from your best workspace patterns.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/90 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center gap-3">
            <CalendarDays className="size-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-950">
              Calendar rhythm
            </h2>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-800">Product sync</span>
            <span className="font-bold text-orange-600">2:30 PM</span>
          </div>
        </article>
      </div>

      <div className="mt-6 flex items-center justify-between pb-4 text-xs font-semibold text-muted-foreground">
        <span>Flowbase dashboard layout v1</span>
        <div className="flex items-center gap-2">
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>Fresh cozy workspace</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </div>
      </div>
    </AppShell>
  );
}
