"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Layers3,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
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
        href: "/",
        icon: LayoutDashboard,
        color: "text-sky-500",
        iconBg: "bg-sky-100",
      },
      {
        label: "Pages / Spaces",
        href: "/",
        icon: Layers3,
        color: "text-violet-500",
        iconBg: "bg-violet-100",
      },
      {
        label: "Notes",
        href: "/",
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
        href: "/",
        icon: Palette,
        color: "text-emerald-500",
        iconBg: "bg-emerald-100",
      },
      {
        label: "Task / Kanban",
        href: "/",
        icon: ClipboardList,
        color: "text-amber-500",
        iconBg: "bg-amber-100",
      },
      {
        label: "AI Template Builder",
        href: "/",
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
        href: "/",
        icon: Bot,
        color: "text-cyan-500",
        iconBg: "bg-cyan-100",
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        color: "text-orange-500",
        iconBg: "bg-orange-100",
      },
      {
        label: "Settings",
        href: "/",
        icon: Settings,
        color: "text-slate-500",
        iconBg: "bg-slate-100",
      },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          "group flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] font-bold text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm",
                          isActive &&
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
                      </Link>
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
          {children}
        </section>
      </div>
    </main>
  );
}
