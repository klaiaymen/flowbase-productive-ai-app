"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  NotebookPen,
  Palette,
  Bot,
  Sparkles,
  Plus,
  CalendarPlus,
  FilePlus,
  PenTool,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Users,
  Shield,
  Layers,
  ChevronRight,
  Flame,
  UserCheck,
  Crown,
  CheckSquare,
  Activity,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DashboardData, getDashboardData } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  initialData: DashboardData | null;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (showRefreshing = true) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);
    try {
      const res = await getDashboardData();
      if (!res) {
        setError("Failed to fetch dashboard data. Please try signing in again.");
      } else {
        setData(res);
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "An unexpected error occurred while loading dashboard.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchDashboard(false);
    }
  }, [initialData]);

  const categoryColorMap: Record<string, string> = {
    work: "bg-sky-100 text-sky-800 border-sky-200",
    learning: "bg-purple-100 text-purple-800 border-purple-200",
    urgent: "bg-rose-100 text-rose-800 border-rose-200",
    ideas: "bg-amber-100 text-amber-800 border-amber-200",
    personal: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "superuser":
        return { label: "Superuser", bg: "bg-purple-100 text-purple-800 border-purple-200", icon: Crown };
      case "pmo":
        return { label: "PMO Officer", bg: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Shield };
      case "chef_projet":
        return { label: "Chef de Projet", bg: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: UserCheck };
      case "member":
      default:
        return { label: "Team Member", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: Users };
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
          <div className="h-32 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/80" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/60 border border-white/80" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-white/60 border border-white/80" />
            <div className="h-64 rounded-2xl bg-white/60 border border-white/80" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center space-y-4 py-16">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertTriangle className="size-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Unavailable</h2>
          <p className="text-slate-600 text-sm">{error || "Could not load user data."}</p>
          <Button
            onClick={() => fetchDashboard(true)}
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </AppShell>
    );
  }

  const { user, featureStatus, taskSummary, upcomingCalendar, recentActivity, recentPages, aiInsights, projectOwnerStats, superUserManagement } = data;
  const roleBadge = getRoleBadge(user.role);
  const RoleIcon = roleBadge.icon;

  const quickActions = [
    {
      title: "Create Task",
      subtitle: "Add to Kanban board",
      href: "/kanban",
      icon: Plus,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10 hover:bg-amber-500/15 border-amber-200/80",
    },
    {
      title: "Add Calendar Reminder",
      subtitle: "Schedule event or task",
      href: "/calendar",
      icon: CalendarPlus,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10 hover:bg-orange-500/15 border-orange-200/80",
    },
    {
      title: "Create Note",
      subtitle: "Start writing in editor",
      href: "/notes",
      icon: FilePlus,
      color: "text-rose-600",
      bgColor: "bg-rose-500/10 hover:bg-rose-500/15 border-rose-200/80",
    },
    {
      title: "Open Whiteboard",
      subtitle: "Sketch out ideas",
      href: "/whiteboard",
      icon: PenTool,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-200/80",
    },
    {
      title: "Ask AI Assistant",
      subtitle: "Chat & control your workspace",
      href: "/assistant",
      icon: Bot,
      color: "text-cyan-600",
      bgColor: "bg-cyan-500/10 hover:bg-cyan-500/15 border-cyan-200/80",
    },
    {
      title: "Generate AI Template",
      subtitle: "Build mini web apps",
      href: "/templates",
      icon: Sparkles,
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-500/10 hover:bg-fuchsia-500/15 border-fuchsia-200/80",
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        {/* ── 1. Top Welcome Header Card ── */}
        <header className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-gradient-to-r from-white/90 via-white/80 to-cyan-50/70 p-6 md:p-8 shadow-[0_20px_60px_rgba(52,86,118,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Workspace
                </span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border", roleBadge.bg)}>
                  <RoleIcon className="size-3.5" />
                  {roleBadge.label}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950">
                Welcome back, {user.name || user.email.split("@")[0]} 👋
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Here is your cozy, clean activity overview. Track your tasks, calendar rhythm, living docs, sketches, and AI tools in real time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDashboard(true)}
                disabled={isRefreshing}
                className="h-10 rounded-xl border-slate-200/80 bg-white/90 px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RefreshCw className={cn("mr-2 size-3.5 text-cyan-600", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Syncing..." : "Refresh Data"}
              </Button>
            </div>
          </div>
        </header>

        {/* ── 2. App Functionality Status Cards ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              App Functionality Status
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Calendar Card */}
            <Link
              href="/calendar"
              className="group rounded-2xl border border-white/90 bg-white/80 p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-orange-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform">
                  <CalendarDays className="size-4" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {featureStatus.calendar.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Calendar</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {featureStatus.calendar.total} items ({featureStatus.calendar.upcoming} upcoming)
              </p>
            </Link>

            {/* Kanban / Tasks Card */}
            <Link
              href="/kanban"
              className="group rounded-2xl border border-white/90 bg-white/80 p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-amber-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                  <ClipboardList className="size-4" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {featureStatus.kanban.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Kanban / Tasks</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {featureStatus.kanban.boardsCount} boards • {featureStatus.kanban.totalTasks} tasks
              </p>
            </Link>

            {/* Notes Card */}
            <Link
              href="/notes"
              className="group rounded-2xl border border-white/90 bg-white/80 p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-rose-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
                  <NotebookPen className="size-4" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {featureStatus.notes.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Notes</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {featureStatus.notes.total} notes ({featureStatus.notes.pinned} pinned)
              </p>
            </Link>

            {/* Whiteboard Card */}
            <Link
              href="/whiteboard"
              className="group rounded-2xl border border-white/90 bg-white/80 p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                  <Palette className="size-4" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {featureStatus.whiteboard.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Whiteboard</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {featureStatus.whiteboard.total} whiteboards
              </p>
            </Link>

            {/* AI Assistant Card */}
            <Link
              href="/assistant"
              className="group rounded-2xl border border-white/90 bg-white/80 p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-cyan-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 group-hover:scale-110 transition-transform">
                  <Bot className="size-4" />
                </div>
                <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                  {featureStatus.aiAssistant.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">AI Assistant</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Smart Refiner & Generator
              </p>
            </Link>

            {/* AI Template Builder Card */}
            <Link
              href="/templates"
              className="group rounded-2xl border border-white/90 bg-white/80 p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-fuchsia-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600 group-hover:scale-110 transition-transform">
                  <Sparkles className="size-4" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {featureStatus.aiTemplates.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-fuchsia-600 transition-colors">AI Template Builder</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {featureStatus.aiTemplates.total} apps ({featureStatus.aiTemplates.pinned} pinned)
              </p>
            </Link>
          </div>
        </section>

        {/* ── 3. Quick Access Features (Navigate Only) ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Quick Access Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={cn(
                    "group flex flex-col justify-between rounded-2xl border p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md",
                    action.bgColor
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("flex size-9 items-center justify-center rounded-xl bg-white shadow-xs", action.color)}>
                      <ActionIcon className="size-4" />
                    </div>
                    <ArrowUpRight className="size-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{action.title}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{action.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── 4. Task Summary & Visual Progress ── */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
          {/* Task Summary Card */}
          <div className="rounded-[1.75rem] border border-white/90 bg-white/80 p-6 shadow-sm backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <CheckSquare className="size-5 text-amber-500" />
                  Task Summary & Progress
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregate execution stats across your active Kanban boards and sync calendar.
                </p>
              </div>
              <span className="rounded-full bg-slate-900 text-white text-xs font-bold px-3 py-1 shadow-sm">
                {taskSummary.progressPercentage}% Done
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Task Completion Progress</span>
                <span>{taskSummary.completedTasks} of {taskSummary.totalTasks} completed</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-500 transition-all duration-500"
                  style={{ width: `${taskSummary.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tasks</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{taskSummary.totalTasks}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-black text-emerald-950 mt-1">{taskSummary.completedTasks}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-black text-amber-950 mt-1">{taskSummary.pendingTasks}</p>
              </div>
              <div className={cn("rounded-2xl p-3.5 border", taskSummary.overdueTasks > 0 ? "border-rose-200 bg-rose-50/70" : "border-slate-100 bg-slate-50/70")}>
                <p className={cn("text-[11px] font-bold uppercase tracking-wider", taskSummary.overdueTasks > 0 ? "text-rose-700" : "text-slate-500")}>
                  Overdue
                </p>
                <p className={cn("text-2xl font-black mt-1", taskSummary.overdueTasks > 0 ? "text-rose-950" : "text-slate-900")}>
                  {taskSummary.overdueTasks}
                </p>
              </div>
            </div>

            {/* Priority breakdown pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Priorities:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                High ({taskSummary.priorityBreakdown.high})
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                Medium ({taskSummary.priorityBreakdown.medium})
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                Low ({taskSummary.priorityBreakdown.low})
              </span>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="rounded-[1.75rem] border border-fuchsia-200/80 bg-gradient-to-br from-violet-50/90 via-fuchsia-50/50 to-cyan-50/80 p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20">
                    <Sparkles className="size-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-950">AI Insights</h2>
                </div>
                <span className="rounded-full bg-white/80 border border-fuchsia-200 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-700">
                  Real-time
                </span>
              </div>

              <div className="space-y-3">
                {aiInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-2xl bg-white/80 p-3 text-xs font-medium text-slate-800 shadow-xs border border-white/90 leading-relaxed"
                  >
                    <div className="size-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-fuchsia-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Need AI assistance?</span>
              <Link href="/assistant" className="font-bold text-cyan-700 hover:underline flex items-center gap-1">
                Open AI Assistant
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 5. Upcoming Calendar Tasks / Reminders & Recent Activity ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Calendar Items */}
          <div className="rounded-[1.75rem] border border-white/90 bg-white/80 p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Upcoming Calendar & Reminders</h2>
                  <p className="text-xs text-slate-500">Scheduled events and sync reminders</p>
                </div>
              </div>
              <Link href="/calendar" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-0.5">
                View Calendar
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {upcomingCalendar.length === 0 ? (
              <div className="py-8 text-center space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <Clock className="mx-auto size-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No upcoming calendar items scheduled.</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Add reminders or sync tasks to your calendar to keep your schedule organized.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/calendar")}
                  className="h-8 rounded-xl border-orange-200 bg-white text-xs text-orange-700 hover:bg-orange-50 mt-1"
                >
                  <Plus className="mr-1 size-3.5" />
                  Add Reminder
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingCalendar.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold text-xs">
                        {item.type === "reminder" ? "🔔" : "📌"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>{item.date || "Draft Date"}</span>
                          {item.time && <span>• {item.time}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border", categoryColorMap[item.category] || "bg-slate-100 text-slate-700 border-slate-200")}>
                        {item.category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="rounded-[1.75rem] border border-white/90 bg-white/80 p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Recent Activity</h2>
                  <p className="text-xs text-slate-500">Latest actions performed across Flowbase</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">Live log</span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-8 text-center space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <Activity className="mx-auto size-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No activity logged yet.</p>
                <p className="text-[11px] text-slate-500">Start creating tasks, notes, or whiteboards!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {recentActivity.map((act) => (
                  <Link
                    key={act.id}
                    href={act.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-xs hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                        {act.type === "task" && "📋"}
                        {act.type === "note" && "📝"}
                        {act.type === "reminder" && "⏰"}
                        {act.type === "whiteboard" && "🎨"}
                        {act.type === "ai_template" && "✨"}
                        {act.type === "space_page" && "📄"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{act.title}</p>
                        <p className="text-[11px] font-semibold text-cyan-700">{act.action}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                      {act.relativeTime}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 6. Recent Pages / Living Docs & Whiteboards ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
              <Layers className="size-4 text-violet-500" />
              Recent Pages & Living Assets
            </h2>
            <Link href="/spaces" className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-0.5">
              All Pages & Spaces
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {recentPages.map((page) => (
              <Link
                key={page.id}
                href={page.href}
                className="group rounded-2xl border border-white/90 bg-white/80 p-4 shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {page.type.replace("_", " ")}
                  </span>
                  <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
                <p className="text-xs font-bold text-slate-950 truncate group-hover:text-violet-600 transition-colors">
                  {page.title}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Updated {page.updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 7. Project Owners / Creators Section ── */}
        {projectOwnerStats && (
          <section className="rounded-[1.75rem] border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/70 p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Project Owner / Creator Statistics</h2>
                  <p className="text-xs text-slate-500">Overview of all project boards you own and manage</p>
                </div>
              </div>
              <Link href="/kanban" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                Manage Projects
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-2xl bg-white/90 border border-emerald-100 p-4 shadow-xs">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Projects</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{projectOwnerStats.totalProjects}</p>
              </div>
              <div className="rounded-2xl bg-white/90 border border-emerald-100 p-4 shadow-xs">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Status</p>
                <p className="text-2xl font-black text-emerald-950 mt-1">{projectOwnerStats.activeProjects}</p>
              </div>
              <div className="rounded-2xl bg-white/90 border border-amber-100 p-4 shadow-xs">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">On Hold</p>
                <p className="text-2xl font-black text-amber-950 mt-1">{projectOwnerStats.onHoldProjects}</p>
              </div>
              <div className="rounded-2xl bg-white/90 border border-indigo-100 p-4 shadow-xs">
                <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Team Members</p>
                <p className="text-2xl font-black text-indigo-950 mt-1">{projectOwnerStats.totalMembers}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── 8. Super User Management Section ── */}
        {superUserManagement && (
          <section className="rounded-[1.75rem] border border-purple-200/80 bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/70 p-6 shadow-sm backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                    Super User Management
                    <span className="rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 border border-purple-200">
                      Superuser Only
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">System user metrics and RBAC administration</p>
                </div>
              </div>
              <Link href="/admin">
                <Button className="rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-md shadow-purple-200">
                  <Shield className="mr-1.5 size-3.5" />
                  Full Admin Panel
                </Button>
              </Link>
            </div>

            {/* User role counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-2xl bg-white/90 border border-purple-100 p-3.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Registered</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{superUserManagement.totalUsers}</p>
              </div>
              <div className="rounded-2xl bg-purple-100/60 border border-purple-200 p-3.5">
                <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Superusers</p>
                <p className="text-xl font-black text-purple-950 mt-0.5">{superUserManagement.roleCounts.superuser}</p>
              </div>
              <div className="rounded-2xl bg-indigo-100/60 border border-indigo-200 p-3.5">
                <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">PMO Officers</p>
                <p className="text-xl font-black text-indigo-950 mt-0.5">{superUserManagement.roleCounts.pmo}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100/60 border border-emerald-200 p-3.5">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Chefs de Projet</p>
                <p className="text-xl font-black text-emerald-950 mt-0.5">{superUserManagement.roleCounts.chef_projet}</p>
              </div>
              <div className="rounded-2xl bg-slate-100/80 border border-slate-200 p-3.5">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Members</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{superUserManagement.roleCounts.member}</p>
              </div>
            </div>

            {/* Recent users table snippet */}
            <div className="rounded-2xl border border-purple-100 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-purple-100 bg-purple-50/40 flex items-center justify-between text-xs font-bold text-purple-950">
                <span>Recent User Registrations</span>
                <span>Role</span>
              </div>
              <div className="divide-y divide-slate-100">
                {superUserManagement.recentUsers.map((usr) => (
                  <div key={usr.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{usr.name || "Unnamed User"}</p>
                      <p className="text-[11px] text-slate-500">{usr.email}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border", getRoleBadge(usr.role).bg)}>
                      {usr.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
