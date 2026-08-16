"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
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
  Shield,
  Pin,
  Flame, Wallet, Utensils, GraduationCap, CheckSquare, Activity, Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPinnedAiTemplates } from "@/app/templates/actions";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Wallet, Utensils, GraduationCap, CheckSquare, Activity, Target, Sparkles,
};

export function AppShell({ children, noPadding }: { children: React.ReactNode; noPadding?: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const isSuperuser = role === "superuser";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pinnedApps, setPinnedApps] = useState<Array<{ id: number; appName: string; icon: string; color: string }>>([]);

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
          href: "/spaces",
          icon: Layers3,
          color: "text-violet-500",
          iconBg: "bg-violet-100",
        },
        {
          label: "Notes",
          href: "/notes",
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
          href: "/whiteboard",
          icon: Palette,
          color: "text-emerald-500",
          iconBg: "bg-emerald-100",
        },
        {
          label: "Task / Kanban",
          href: "/kanban",
          icon: ClipboardList,
          color: "text-amber-500",
          iconBg: "bg-amber-100",
        },
        {
          label: "AI Template Builder",
          href: "/templates",
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
        ...(isSuperuser
          ? [
              {
                label: "Admin Panel",
                href: "/admin",
                icon: Shield,
                color: "text-purple-600",
                iconBg: "bg-purple-100",
              },
            ]
          : []),
      ],
    },
  ];

  useEffect(() => {
    getPinnedAiTemplates().then((apps) => {
      setPinnedApps(apps);
    });
  }, [pathname]);

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

                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-xs font-semibold transition-all duration-200",
                          isActive
                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                            : "text-slate-600 hover:bg-white/90 hover:text-slate-950 hover:shadow-sm",
                          isCollapsed && "justify-center px-0 py-2.5",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                            isActive ? "bg-white/15" : item.iconBg,
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 transition-colors",
                              isActive ? "text-white" : item.color,
                            )}
                          />
                        </div>

                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ── Pinned AI Apps Section ── */}
            {pinnedApps.length > 0 && (
              <div>
                {!isCollapsed && (
                  <p className="mb-1.5 flex items-center gap-1 rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-fuchsia-600">
                    <Pin className="size-2.5 fill-fuchsia-600" />
                    Pinned Apps ({pinnedApps.length}/3)
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {pinnedApps.map((app) => {
                    const AppIcon = ICON_MAP[app.icon] || Sparkles;
                    const href = `/templates/${app.id}`;
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={app.id}
                        href={href}
                        title={isCollapsed ? app.appName : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-xs font-semibold transition-all duration-200",
                          isActive
                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                            : "text-slate-600 hover:bg-white/90 hover:text-slate-950 hover:shadow-sm",
                          isCollapsed && "justify-center px-0 py-2.5",
                        )}
                      >
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                          style={{ backgroundColor: app.color || "#8B5CF6" }}
                        >
                          <AppIcon className="size-3.5 text-white" />
                        </div>

                        {!isCollapsed && (
                          <span className="truncate font-semibold">{app.appName}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          <div
            className={cn(
              "mt-auto flex items-center justify-between gap-2 border-t border-cyan-100/70 pt-3",
              isCollapsed && "justify-center border-none pt-2",
            )}
          >
            <UserButton />
            {!isCollapsed && (
              <span className="text-[10px] font-medium text-slate-400">
                Logged in
              </span>
            )}
          </div>
        </aside>

        <section
          className={cn(
            "flex-1 min-w-0 min-h-screen",
            noPadding ? "p-0" : "p-4 md:p-6 lg:p-8",
          )}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
