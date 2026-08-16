"use server";

import { auth } from "@clerk/nextjs/server";
import {
  db,
  users,
  calendarItems,
  kanbanBoards,
  kanbanColumns,
  kanbanTasks,
  notes,
  whiteboards,
  spaces,
  pages,
  aiTemplates,
  kanbanBoardShares,
  Role,
} from "@/db";
import { eq, and, desc, inArray, isNull, exists, or } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";

export interface DashboardData {
  user: {
    id: number;
    name: string | null;
    email: string;
    role: Role;
    clerkUserId: string;
  };
  featureStatus: {
    calendar: { total: number; upcoming: number; status: string };
    kanban: { boardsCount: number; totalTasks: number; doneTasks: number; status: string };
    notes: { total: number; pinned: number; status: string };
    whiteboard: { total: number; status: string };
    aiAssistant: { status: string; promptRuns: number };
    aiTemplates: { total: number; pinned: number; status: string };
  };
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    progressPercentage: number;
    priorityBreakdown: { high: number; medium: number; low: number };
  };
  upcomingCalendar: Array<{
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    type: string; // 'task' | 'reminder'
    category: string; // 'work' | 'learning' | 'urgent' | 'ideas' | 'personal'
    isOverdue: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    type: "task" | "note" | "reminder" | "whiteboard" | "ai_template" | "space_page";
    action: string;
    timestamp: Date;
    relativeTime: string;
    href: string;
  }>;
  recentPages: Array<{
    id: string;
    title: string;
    type: "note" | "whiteboard" | "kanban" | "ai_template" | "space_page";
    color: string;
    updatedAt: Date;
    href: string;
  }>;
  aiInsights: string[];
  projectOwnerStats?: {
    totalProjects: number;
    activeProjects: number;
    onHoldProjects: number;
    cancelledProjects: number;
    totalProjectTasks: number;
    completedProjectTasks: number;
    totalMembers: number;
  };
  superUserManagement?: {
    totalUsers: number;
    roleCounts: Record<Role, number>;
    recentUsers: Array<{
      id: number;
      name: string | null;
      email: string;
      role: Role;
      createdAt: Date;
    }>;
  };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const currentUserObj = await syncCurrentUser();
    const { userId: clerkUserId } = await auth();

    if (!currentUserObj || !clerkUserId) {
      return null;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // ─── 1. Query Notes ───
    const userNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.clerkUserId, clerkUserId), eq(notes.isTrashed, false)))
      .orderBy(desc(notes.updatedAt));

    const pinnedNotesCount = userNotes.filter((n) => n.isPinned).length;

    // ─── 2. Query Whiteboards ───
    const userWhiteboards = await db
      .select()
      .from(whiteboards)
      .where(eq(whiteboards.clerkUserId, clerkUserId))
      .orderBy(desc(whiteboards.updatedAt));

    // ─── 3. Query AI Templates ───
    const userAiTemplates = await db
      .select()
      .from(aiTemplates)
      .where(eq(aiTemplates.clerkUserId, clerkUserId))
      .orderBy(desc(aiTemplates.createdAt));

    const pinnedAiCount = userAiTemplates.filter((t) => t.isPinnedToSidebar).length;

    // ─── 4. Query Spaces & Pages ───
    const userSpaces = await db
      .select()
      .from(spaces)
      .where(and(eq(spaces.clerkUserId, clerkUserId), eq(spaces.isArchived, false)))
      .orderBy(desc(spaces.updatedAt));

    const userPages = await db
      .select()
      .from(pages)
      .where(and(eq(pages.clerkUserId, clerkUserId), eq(pages.isArchived, false)))
      .orderBy(desc(pages.updatedAt));

    // ─── 5. Query Calendar Items ───
    const userCalendarItems = await db
      .select()
      .from(calendarItems)
      .where(eq(calendarItems.userId, currentUserObj.id))
      .orderBy(desc(calendarItems.createdAt));

    const upcomingCalendarItems = userCalendarItems
      .filter((item) => !item.date || item.date >= todayStr)
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      })
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        time: item.time,
        type: item.type,
        category: item.category,
        isOverdue: !!item.date && item.date < todayStr,
      }));

    // ─── 6. Query Kanban Boards & Tasks ───
    let accessibleBoards = [];
    if (currentUserObj.role === "superuser" || currentUserObj.role === "pmo") {
      accessibleBoards = await db.select().from(kanbanBoards).orderBy(desc(kanbanBoards.createdAt));
    } else if (currentUserObj.role === "chef_projet") {
      accessibleBoards = await db
        .select()
        .from(kanbanBoards)
        .where(eq(kanbanBoards.userId, currentUserObj.id))
        .orderBy(desc(kanbanBoards.createdAt));
    } else {
      // Member role: owned or shared
      accessibleBoards = await db
        .select({
          id: kanbanBoards.id,
          userId: kanbanBoards.userId,
          name: kanbanBoards.name,
          color: kanbanBoards.color,
          description: kanbanBoards.description,
          manualStatus: kanbanBoards.manualStatus,
          createdAt: kanbanBoards.createdAt,
        })
        .from(kanbanBoards)
        .where(
          or(
            eq(kanbanBoards.userId, currentUserObj.id),
            exists(
              db
                .select()
                .from(kanbanBoardShares)
                .where(
                  and(
                    eq(kanbanBoardShares.boardId, kanbanBoards.id),
                    eq(kanbanBoardShares.email, currentUserObj.email)
                  )
                )
            )
          )
        )
        .orderBy(desc(kanbanBoards.createdAt));
    }

    const boardIds = accessibleBoards.map((b) => b.id);

    let allColumns: Array<{ id: number; boardId: number; name: string; position: number }> = [];
    let allTasks: Array<{
      id: number;
      columnId: number;
      title: string;
      description: string | null;
      dueDate: string | null;
      priority: string;
      position: number;
      createdAt: Date;
    }> = [];

    if (boardIds.length > 0) {
      allColumns = await db
        .select()
        .from(kanbanColumns)
        .where(inArray(kanbanColumns.boardId, boardIds));

      const colIds = allColumns.map((c) => c.id);
      if (colIds.length > 0) {
        allTasks = await db
          .select({
            id: kanbanTasks.id,
            columnId: kanbanTasks.columnId,
            title: kanbanTasks.title,
            description: kanbanTasks.description,
            dueDate: kanbanTasks.dueDate,
            priority: kanbanTasks.priority,
            position: kanbanTasks.position,
            createdAt: kanbanTasks.createdAt,
          })
          .from(kanbanTasks)
          .where(inArray(kanbanTasks.columnId, colIds))
          .orderBy(desc(kanbanTasks.createdAt));
      }
    }

    const colMap = new Map(allColumns.map((c) => [c.id, c.name.toLowerCase()]));

    let completedTasksCount = 0;
    let pendingTasksCount = 0;
    let overdueTasksCount = 0;
    let highPriorityCount = 0;
    let mediumPriorityCount = 0;
    let lowPriorityCount = 0;

    allTasks.forEach((t) => {
      const colName = colMap.get(t.columnId) || "";
      const isDone =
        colName.includes("done") ||
        colName.includes("completed") ||
        colName.includes("terminé") ||
        colName.includes("finish");

      if (isDone) {
        completedTasksCount++;
      } else {
        pendingTasksCount++;
        if (t.dueDate && t.dueDate < todayStr) {
          overdueTasksCount++;
        }
      }

      if (t.priority === "high") highPriorityCount++;
      else if (t.priority === "medium") mediumPriorityCount++;
      else if (t.priority === "low") lowPriorityCount++;
    });

    const totalTasksCount = allTasks.length;
    const progressPercentage =
      totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // ─── 7. Recent Activity Feed ───
    const rawActivity: Array<{
      id: string;
      title: string;
      type: "task" | "note" | "reminder" | "whiteboard" | "ai_template" | "space_page";
      action: string;
      timestamp: Date;
      href: string;
    }> = [];

    allTasks.slice(0, 5).forEach((t) => {
      rawActivity.push({
        id: `task-${t.id}`,
        title: t.title,
        type: "task",
        action: "Created task",
        timestamp: new Date(t.createdAt),
        href: "/kanban",
      });
    });

    userNotes.slice(0, 5).forEach((n) => {
      rawActivity.push({
        id: `note-${n.id}`,
        title: n.title || "Untitled Note",
        type: "note",
        action: "Updated note",
        timestamp: new Date(n.updatedAt),
        href: "/notes",
      });
    });

    userCalendarItems.slice(0, 5).forEach((c) => {
      rawActivity.push({
        id: `cal-${c.id}`,
        title: c.title,
        type: "reminder",
        action: c.type === "reminder" ? "Added calendar reminder" : "Added calendar task",
        timestamp: new Date(c.createdAt),
        href: "/calendar",
      });
    });

    userWhiteboards.slice(0, 5).forEach((w) => {
      rawActivity.push({
        id: `wb-${w.id}`,
        title: w.name,
        type: "whiteboard",
        action: "Updated whiteboard",
        timestamp: new Date(w.updatedAt),
        href: "/whiteboard",
      });
    });

    userAiTemplates.slice(0, 5).forEach((a) => {
      rawActivity.push({
        id: `ai-${a.id}`,
        title: a.appName,
        type: "ai_template",
        action: "Generated AI template",
        timestamp: new Date(a.createdAt),
        href: `/templates/${a.id}`,
      });
    });

    userPages.slice(0, 5).forEach((p) => {
      rawActivity.push({
        id: `page-${p.id}`,
        title: p.name,
        type: "space_page",
        action: "Updated page",
        timestamp: new Date(p.updatedAt),
        href: "/spaces",
      });
    });

    rawActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const recentActivity = rawActivity.slice(0, 10).map((act) => ({
      ...act,
      relativeTime: formatRelativeTime(act.timestamp),
    }));

    // ─── 8. Recent Pages ───
    const rawPages: Array<{
      id: string;
      title: string;
      type: "note" | "whiteboard" | "kanban" | "ai_template" | "space_page";
      color: string;
      updatedAt: Date;
      href: string;
    }> = [];

    userNotes.slice(0, 3).forEach((n) => {
      rawPages.push({
        id: `note-${n.id}`,
        title: n.title || "Untitled Note",
        type: "note",
        color: n.color || "rose",
        updatedAt: new Date(n.updatedAt),
        href: "/notes",
      });
    });

    userWhiteboards.slice(0, 3).forEach((w) => {
      rawPages.push({
        id: `wb-${w.id}`,
        title: w.name,
        type: "whiteboard",
        color: w.color || "emerald",
        updatedAt: new Date(w.updatedAt),
        href: "/whiteboard",
      });
    });

    accessibleBoards.slice(0, 3).forEach((b) => {
      rawPages.push({
        id: `board-${b.id}`,
        title: b.name,
        type: "kanban",
        color: b.color || "#3B82F6",
        updatedAt: new Date(b.createdAt),
        href: "/kanban",
      });
    });

    userAiTemplates.slice(0, 3).forEach((a) => {
      rawPages.push({
        id: `ai-${a.id}`,
        title: a.appName,
        type: "ai_template",
        color: a.color || "#8B5CF6",
        updatedAt: new Date(a.updatedAt),
        href: `/templates/${a.id}`,
      });
    });

    rawPages.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const recentPages = rawPages.slice(0, 8);

    // ─── 9. Dynamic AI Insights ───
    const aiInsights: string[] = [];

    if (overdueTasksCount > 0) {
      aiInsights.push(
        `⚠️ You have ${overdueTasksCount} overdue task${overdueTasksCount > 1 ? "s" : ""}. Addressing these first will keep your flow smooth.`
      );
    } else if (totalTasksCount > 0 && completedTasksCount === totalTasksCount) {
      aiInsights.push(`🎉 Amazing work! All ${totalTasksCount} tasks in your workspace are completed.`);
    } else {
      aiInsights.push(`✅ You have completed ${progressPercentage}% of your total tasks.`);
    }

    // Most active workspace check
    const counts = [
      { name: "Notes", count: userNotes.length },
      { name: "Kanban / Tasks", count: totalTasksCount },
      { name: "Whiteboard", count: userWhiteboards.length },
      { name: "AI Templates", count: userAiTemplates.length },
      { name: "Spaces", count: userSpaces.length },
    ];
    counts.sort((a, b) => b.count - a.count);

    if (counts[0].count > 0) {
      aiInsights.push(
        `📌 Your most active workspace is ${counts[0].name} with ${counts[0].count} item${counts[0].count > 1 ? "s" : ""}.`
      );
    }

    const todayReminders = userCalendarItems.filter((i) => i.date === todayStr);
    if (todayReminders.length > 0) {
      aiInsights.push(
        `📅 You have ${todayReminders.length} item${todayReminders.length > 1 ? "s" : ""} scheduled on your calendar for today.`
      );
    } else {
      aiInsights.push(`📅 Your calendar is clear for today. Great time for deep focus!`);
    }

    if (highPriorityCount > 0) {
      aiInsights.push(
        `⚡ Suggested focus: Complete your ${highPriorityCount} high-priority task${highPriorityCount > 1 ? "s" : ""} first.`
      );
    } else {
      aiInsights.push(`💡 Suggested focus: Organize your living docs and try building an AI Template.`);
    }

    // ─── 10. Project Owner (Creator) Stats ───
    const isProjectOwnerRole =
      currentUserObj.role === "chef_projet" ||
      currentUserObj.role === "pmo" ||
      currentUserObj.role === "superuser";

    const ownedBoards = accessibleBoards.filter((b) => b.userId === currentUserObj.id);
    const totalProjects = ownedBoards.length || (isProjectOwnerRole ? accessibleBoards.length : 0);

    let projectOwnerStats = undefined;

    if (isProjectOwnerRole || totalProjects > 0) {
      const activeProjects = accessibleBoards.filter(
        (b) => !b.manualStatus || b.manualStatus === "auto"
      ).length;
      const onHoldProjects = accessibleBoards.filter((b) => b.manualStatus === "on_hold").length;
      const cancelledProjects = accessibleBoards.filter(
        (b) => b.manualStatus === "cancelled"
      ).length;

      // Calculate total shares/members across owned boards
      let totalMembers = 0;
      if (boardIds.length > 0) {
        const shares = await db
          .select({ email: kanbanBoardShares.email })
          .from(kanbanBoardShares)
          .where(inArray(kanbanBoardShares.boardId, boardIds));
        totalMembers = new Set(shares.map((s) => s.email.toLowerCase())).size;
      }

      projectOwnerStats = {
        totalProjects,
        activeProjects,
        onHoldProjects,
        cancelledProjects,
        totalProjectTasks: totalTasksCount,
        completedProjectTasks: completedTasksCount,
        totalMembers,
      };
    }

    // ─── 11. Super User Management Stats ───
    let superUserManagement = undefined;
    if (currentUserObj.role === "superuser") {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      const roleCounts: Record<Role, number> = {
        superuser: 0,
        pmo: 0,
        chef_projet: 0,
        member: 0,
      };

      allUsers.forEach((u) => {
        if (roleCounts[u.role] !== undefined) {
          roleCounts[u.role]++;
        }
      });

      superUserManagement = {
        totalUsers: allUsers.length,
        roleCounts,
        recentUsers: allUsers.slice(0, 5).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })),
      };
    }

    return {
      user: {
        id: currentUserObj.id,
        name: currentUserObj.name,
        email: currentUserObj.email,
        role: currentUserObj.role,
        clerkUserId,
      },
      featureStatus: {
        calendar: {
          total: userCalendarItems.length,
          upcoming: upcomingCalendarItems.length,
          status: userCalendarItems.length > 0 ? "Active" : "Ready",
        },
        kanban: {
          boardsCount: accessibleBoards.length,
          totalTasks: totalTasksCount,
          doneTasks: completedTasksCount,
          status: accessibleBoards.length > 0 ? "Active" : "Ready",
        },
        notes: {
          total: userNotes.length,
          pinned: pinnedNotesCount,
          status: userNotes.length > 0 ? "Active" : "Ready",
        },
        whiteboard: {
          total: userWhiteboards.length,
          status: userWhiteboards.length > 0 ? "Active" : "Ready",
        },
        aiAssistant: {
          status: "Online & Ready",
          promptRuns: userAiTemplates.length + userNotes.length,
        },
        aiTemplates: {
          total: userAiTemplates.length,
          pinned: pinnedAiCount,
          status: userAiTemplates.length > 0 ? "Active" : "Ready",
        },
      },
      taskSummary: {
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
        pendingTasks: pendingTasksCount,
        overdueTasks: overdueTasksCount,
        progressPercentage,
        priorityBreakdown: {
          high: highPriorityCount,
          medium: mediumPriorityCount,
          low: lowPriorityCount,
        },
      },
      upcomingCalendar: upcomingCalendarItems,
      recentActivity,
      recentPages,
      aiInsights,
      projectOwnerStats,
      superUserManagement,
    };
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    return null;
  }
}
