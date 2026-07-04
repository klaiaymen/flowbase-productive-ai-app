"use server";

import { db, kanbanBoards, kanbanColumns, kanbanTasks, calendarItems } from "@/db";
import { eq, and, asc, isNull } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";
import { saveCalendarItem, deleteCalendarItem } from "@/app/calendar/actions";

export async function getBoards() {
  try {
    const user = await syncCurrentUser();
    if (user) {
      return await db
        .select()
        .from(kanbanBoards)
        .where(eq(kanbanBoards.userId, user.id))
        .orderBy(kanbanBoards.createdAt);
    } else {
      return await db
        .select()
        .from(kanbanBoards)
        .where(isNull(kanbanBoards.userId))
        .orderBy(kanbanBoards.createdAt);
    }
  } catch (error) {
    console.error("Error in getBoards:", error);
    return [];
  }
}

export async function createBoard(name: string, color: string) {
  try {
    const user = await syncCurrentUser();
    const userId = user ? user.id : null;

    const [board] = await db
      .insert(kanbanBoards)
      .values({ userId, name, color })
      .returning();

    // Create 3 default columns: Todo, In progress, Done
    await db.insert(kanbanColumns).values([
      { boardId: board.id, name: "Todo", position: 0 },
      { boardId: board.id, name: "In progress", position: 1 },
      { boardId: board.id, name: "Done", position: 2 },
    ]);

    return board;
  } catch (error) {
    console.error("Error in createBoard:", error);
    throw new Error("Failed to create board");
  }
}

export async function deleteBoard(boardId: number) {
  try {
    const user = await syncCurrentUser();

    // Find all task calendar item IDs for tasks in columns of this board
    const boardTasks = await db
      .select({ calendarItemId: kanbanTasks.calendarItemId })
      .from(kanbanTasks)
      .innerJoin(kanbanColumns, eq(kanbanTasks.columnId, kanbanColumns.id))
      .where(eq(kanbanColumns.boardId, boardId));

    for (const t of boardTasks) {
      if (t.calendarItemId) {
        try {
          await deleteCalendarItem(t.calendarItemId);
        } catch (e) {
          console.error("Failed to delete synced calendar item:", e);
        }
      }
    }

    await db
      .delete(kanbanBoards)
      .where(
        user
          ? and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, user.id))
          : and(eq(kanbanBoards.id, boardId), isNull(kanbanBoards.userId))
      );

    return { success: true };
  } catch (error) {
    console.error("Error in deleteBoard:", error);
    throw new Error("Failed to delete board");
  }
}

export async function getColumns(boardId: number) {
  try {
    return await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId))
      .orderBy(kanbanColumns.position);
  } catch (error) {
    console.error("Error in getColumns:", error);
    return [];
  }
}

export async function createColumn(boardId: number, name: string) {
  try {
    const existingColumns = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId));

    if (existingColumns.length >= 5) {
      throw new Error("Maximum of 5 columns allowed per board");
    }

    const nextPosition = existingColumns.length;

    const [column] = await db
      .insert(kanbanColumns)
      .values({
        boardId,
        name,
        position: nextPosition,
      })
      .returning();

    return column;
  } catch (error) {
    console.error("Error in createColumn:", error);
    throw error;
  }
}

export async function updateColumn(columnId: number, name: string) {
  try {
    const [column] = await db
      .update(kanbanColumns)
      .set({ name })
      .where(eq(kanbanColumns.id, columnId))
      .returning();
    return column;
  } catch (error) {
    console.error("Error in updateColumn:", error);
    throw new Error("Failed to rename column");
  }
}

export async function deleteColumn(columnId: number) {
  try {
    const columnTasks = await db
      .select({ calendarItemId: kanbanTasks.calendarItemId })
      .from(kanbanTasks)
      .where(eq(kanbanTasks.columnId, columnId));

    for (const t of columnTasks) {
      if (t.calendarItemId) {
        try {
          await deleteCalendarItem(t.calendarItemId);
        } catch (e) {
          console.error("Failed to delete synced calendar item:", e);
        }
      }
    }

    await db
      .delete(kanbanColumns)
      .where(eq(kanbanColumns.id, columnId));

    return { success: true };
  } catch (error) {
    console.error("Error in deleteColumn:", error);
    throw new Error("Failed to delete column");
  }
}

export async function getTasks(boardId: number) {
  try {
    return await db
      .select({
        id: kanbanTasks.id,
        columnId: kanbanTasks.columnId,
        title: kanbanTasks.title,
        description: kanbanTasks.description,
        dueDate: kanbanTasks.dueDate,
        priority: kanbanTasks.priority,
        labels: kanbanTasks.labels,
        syncCalendar: kanbanTasks.syncCalendar,
        syncNotes: kanbanTasks.syncNotes,
        calendarItemId: kanbanTasks.calendarItemId,
        position: kanbanTasks.position,
        createdAt: kanbanTasks.createdAt,
      })
      .from(kanbanTasks)
      .innerJoin(kanbanColumns, eq(kanbanTasks.columnId, kanbanColumns.id))
      .where(eq(kanbanColumns.boardId, boardId))
      .orderBy(kanbanTasks.position);
  } catch (error) {
    console.error("Error in getTasks:", error);
    return [];
  }
}

export async function saveTask(data: {
  id?: number;
  columnId: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: "low" | "medium" | "high";
  labels?: string | null;
  syncCalendar: boolean;
  syncNotes: boolean;
  calendarItemId?: number | null;
  position?: number;
}) {
  try {
    let calendarItemId = data.calendarItemId || null;

    if (data.syncCalendar) {
      const catMap = {
        high: "urgent",
        medium: "work",
        low: "personal"
      };
      const category = catMap[data.priority] || "work";

      const calItem = await saveCalendarItem({
        id: calendarItemId || undefined,
        title: data.title,
        description: data.description || "",
        date: data.dueDate || null,
        time: null,
        type: "task",
        category,
      });
      if (calItem) {
        calendarItemId = calItem.id;
      }
    } else if (calendarItemId) {
      try {
        await deleteCalendarItem(calendarItemId);
      } catch (e) {
        console.error("Failed to delete unsynced calendar item:", e);
      }
      calendarItemId = null;
    }

    if (data.id) {
      const [updated] = await db
        .update(kanbanTasks)
        .set({
          columnId: data.columnId,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          priority: data.priority,
          labels: data.labels,
          syncCalendar: data.syncCalendar,
          syncNotes: data.syncNotes,
          calendarItemId,
        })
        .where(eq(kanbanTasks.id, data.id))
        .returning();
      return updated;
    } else {
      const existingTasks = await db
        .select()
        .from(kanbanTasks)
        .where(eq(kanbanTasks.columnId, data.columnId));
      
      const position = data.position ?? existingTasks.length;

      const [inserted] = await db
        .insert(kanbanTasks)
        .values({
          columnId: data.columnId,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          priority: data.priority,
          labels: data.labels,
          syncCalendar: data.syncCalendar,
          syncNotes: data.syncNotes,
          calendarItemId,
          position,
        })
        .returning();
      return inserted;
    }
  } catch (error) {
    console.error("Error in saveTask:", error);
    throw new Error("Failed to save task");
  }
}

export async function deleteTask(taskId: number) {
  try {
    const [task] = await db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.id, taskId));

    if (task && task.calendarItemId) {
      try {
        await deleteCalendarItem(task.calendarItemId);
      } catch (e) {
        console.error("Failed to delete synced calendar item on task delete:", e);
      }
    }

    await db
      .delete(kanbanTasks)
      .where(eq(kanbanTasks.id, taskId));

    return { success: true };
  } catch (error) {
    console.error("Error in deleteTask:", error);
    throw new Error("Failed to delete task");
  }
}

export async function saveTaskPositions(taskOrders: { id: number; position: number; columnId: number }[]) {
  try {
    await Promise.all(
      taskOrders.map(t =>
        db
          .update(kanbanTasks)
          .set({ position: t.position, columnId: t.columnId })
          .where(eq(kanbanTasks.id, t.id))
      )
    );
    return { success: true };
  } catch (error) {
    console.error("Error in saveTaskPositions:", error);
    throw new Error("Failed to update task positions");
  }
}
