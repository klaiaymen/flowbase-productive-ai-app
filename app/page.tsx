"use client";

import { useState } from "react";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Layers3,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        color: "text-sky-500",
        iconBg: "bg-sky-100",
        active: true,
      },
      {
        label: "Pages / Spaces",
        icon: Layers3,
        color: "text-violet-500",
        iconBg: "bg-violet-100",
      },
      {
        label: "Notes",
        icon: NotebookPen,
        color: "text-rose-500",
        iconBg: "bg-rose-100",
      },
    ],
  },
  {
    label: "Create",
    items: [
      {
        label: "Whiteboard",
        icon: Palette,
        color: "text-emerald-500",
        iconBg: "bg-emerald-100",
      },
      {
        label: "Task / Kanban",
        icon: ClipboardList,
        color: "text-amber-500",
        iconBg: "bg-amber-100",
      },
      {
        label: "AI Template Builder",
        icon: Sparkles,
        color: "text-fuchsia-500",
        iconBg: "bg-fuchsia-100",
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        label: "AI Assistant",
        icon: Bot,
        color: "text-cyan-500",
        iconBg: "bg-cyan-100",
      },
      {
        label: "Calendar",
        icon: CalendarDays,
        color: "text-orange-500",
        iconBg: "bg-orange-100",
      },
      {
        label: "Settings",
        icon: Settings,
        color: "text-slate-500",
        iconBg: "bg-slate-100",
      },
    ],
  },
];

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#bdfbea_0,#effcff_22%,#fff7d6_47%,#f1eaff_72%,#fff7fb_100%)] text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 flex h-screen shrink-0 flex-col border-r border-white/80 bg-white/82 px-2.5 py-3.5 shadow-[8px_0_30px_rgba(47,75,107,0.1)] backdrop-blur-xl transition-all duration-300",
            isCollapsed ? "w-[68px]" : "w-[224px]",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2.5 px-2",
              isCollapsed && "justify-center px-0",
            )}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-fuchsia-500 text-white shadow-lg shadow-cyan-200/70">
              <Sparkles className="size-[18px]" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-slate-950">
                  Flowbase
                </p>
                <p className="truncate text-[10px] font-semibold text-cyan-700/80">
                  Think, plan, sketch
                </p>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "mt-3 size-8 self-end rounded-xl border border-cyan-100 bg-white/85 text-cyan-700 shadow-sm hover:bg-cyan-50 hover:text-cyan-800",
              isCollapsed && "self-center",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsCollapsed((current) => !current)}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-3.5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-3.5" aria-hidden="true" />
            )}
          </Button>

          <nav className="mt-4 flex flex-1 flex-col gap-3.5 overflow-y-auto">
            {sidebarGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <p className="mb-1.5 rounded-full bg-slate-900/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          "group flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] font-bold text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm",
                          item.active &&
                            "bg-white text-slate-950 shadow-sm ring-1 ring-cyan-100",
                          isCollapsed && "justify-center px-0",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-lg transition group-hover:scale-105",
                            item.iconBg,
                          )}
                        >
                          <Icon
                            className={cn("size-3.5", item.color)}
                            aria-hidden="true"
                          />
                        </span>
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div
            className={cn(
              "mt-3 rounded-2xl border border-white/90 bg-gradient-to-br from-white/90 to-cyan-50/80 p-2.5 shadow-sm",
              isCollapsed && "flex justify-center p-2",
            )}
          >
            {isCollapsed ? (
              <UserRound
                className="size-5 text-emerald-500"
                aria-label="Personal workspace"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <UserRound className="size-3.5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-900">
                    Flowbase Pro
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    Personal workspace
                  </p>
                </div>
                <Settings
                  className="size-3.5 shrink-0 text-cyan-500"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
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
                <p className="text-3xl font-bold text-slate-950">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {card.note}
                </p>
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
                Draft a sprint brief, turn notes into tasks, and generate a
                reusable project template from your best workspace patterns.
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
                <span className="font-semibold text-slate-800">
                  Product sync
                </span>
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
        </section>
      </div>
    </main>
  );
}
