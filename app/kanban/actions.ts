"use server";

import { db, kanbanBoards, kanbanColumns, kanbanTasks, calendarItems, kanbanBoardShares, users } from "@/db";
import { eq, and, asc, isNull, or, exists } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";
import { AuthError } from "@/lib/errors";
import { saveCalendarItem, deleteCalendarItem } from "@/app/calendar/actions";

export async function getBoards() {
  try {
    const user = await syncCurrentUser();
    if (user) {
      // Return boards owned by the user OR boards shared with the user's email
      return await db
        .select({
          id: kanbanBoards.id,
          userId: kanbanBoards.userId,
          name: kanbanBoards.name,
          color: kanbanBoards.color,
          createdAt: kanbanBoards.createdAt,
        })
        .from(kanbanBoards)
        .where(
          or(
            eq(kanbanBoards.userId, user.id),
            exists(
              db
                .select()
                .from(kanbanBoardShares)
                .where(
                  and(
                    eq(kanbanBoardShares.boardId, kanbanBoards.id),
                    eq(kanbanBoardShares.email, user.email)
                  )
                )
            )
          )
        )
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
    if (!user) {
      throw new AuthError("You must be signed in to create a Kanban board.");
    }
    const userId = user.id;

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
  } catch (error: any) {
    console.error("Error in createBoard:", error);
    throw new Error(error.message || "Failed to create board");
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

export async function getBoardShares(boardId: number) {
  try {
    const user = await syncCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Allow viewing if the user owns the board or if the board is shared with them
    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, user.id)));

    const isShared = await db
      .select()
      .from(kanbanBoardShares)
      .where(and(eq(kanbanBoardShares.boardId, boardId), eq(kanbanBoardShares.email, user.email)));

    if (!board && isShared.length === 0) {
      throw new Error("Forbidden");
    }

    const shares = await db
      .select()
      .from(kanbanBoardShares)
      .where(eq(kanbanBoardShares.boardId, boardId))
      .orderBy(kanbanBoardShares.createdAt);

    // Resolve user accounts if they exist in our db
    const resolvedShares = await Promise.all(
      shares.map(async (share) => {
        const [existingUser] = await db
          .select({
            id: users.id,
            name: users.name,
          })
          .from(users)
          .where(eq(users.email, share.email));

        return {
          id: share.id,
          email: share.email,
          createdAt: share.createdAt,
          hasAccount: !!existingUser,
          userName: existingUser?.name || null,
          userId: existingUser?.id || null,
        };
      })
    );

    return resolvedShares;
  } catch (error) {
    console.error("Error in getBoardShares:", error);
    throw error;
  }
}

export async function shareBoard(boardId: number, email: string) {
  try {
    const user = await syncCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Only owner of the board can invite others
    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, user.id)));

    if (!board) {
      throw new Error("Only the board owner can share it");
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Email is required");

    if (cleanEmail === user.email.toLowerCase()) {
      throw new Error("You cannot share the board with yourself");
    }

    // Check if already shared
    const [existingShare] = await db
      .select()
      .from(kanbanBoardShares)
      .where(and(eq(kanbanBoardShares.boardId, boardId), eq(kanbanBoardShares.email, cleanEmail)));

    if (existingShare) {
      throw new Error("Board is already shared with this email");
    }

    const [newShare] = await db
      .insert(kanbanBoardShares)
      .values({
        boardId,
        email: cleanEmail,
      })
      .returning();

    // Check if user has account
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail));

    return {
      id: newShare.id,
      email: newShare.email,
      createdAt: newShare.createdAt,
      hasAccount: !!existingUser,
      userName: existingUser?.name || null,
      userId: existingUser?.id || null,
    };
  } catch (error: any) {
    console.error("Error in shareBoard:", error);
    throw new Error(error.message || "Failed to share board");
  }
}

export async function removeShare(boardId: number, shareId: number) {
  try {
    const user = await syncCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Only owner can remove shares
    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, user.id)));

    if (!board) {
      throw new Error("Only the board owner can modify sharing permissions");
    }

    await db
      .delete(kanbanBoardShares)
      .where(and(eq(kanbanBoardShares.id, shareId), eq(kanbanBoardShares.boardId, boardId)));

    return { success: true };
  } catch (error: any) {
    console.error("Error in removeShare:", error);
    throw new Error(error.message || "Failed to remove share");
  }
}
