"use server";

import { db, calendarItems } from "@/db";
import { eq, isNull, and } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";
import { AuthError } from "@/lib/errors";

export async function getCalendarItems() {
  try {
    const user = await syncCurrentUser();
    if (user) {
      return await db
        .select()
        .from(calendarItems)
        .where(eq(calendarItems.userId, user.id))
        .orderBy(calendarItems.createdAt);
    } else {
      // Fallback for local development if not signed in / clerk bypassed
      return await db
        .select()
        .from(calendarItems)
        .where(isNull(calendarItems.userId))
        .orderBy(calendarItems.createdAt);
    }
  } catch (error) {
    console.error("Error in getCalendarItemsServerAction:", error);
    return [];
  }
}

export async function saveCalendarItem(data: {
  id?: number;
  title: string;
  description?: string | null;
  date?: string | null; // YYYY-MM-DD
  time?: string | null; // HH:MM
  type: "task" | "reminder";
  category: string;
}) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      throw new AuthError("You must be signed in to add or update calendar items.");
    }
    const userId = user.id;

    if (data.id) {
      // Update
      const [updated] = await db
        .update(calendarItems)
        .set({
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          type: data.type,
          category: data.category,
        })
        .where(and(eq(calendarItems.id, data.id), eq(calendarItems.userId, userId)))
        .returning();
      return updated;
    } else {
      // Insert
      const [inserted] = await db
        .insert(calendarItems)
        .values({
          userId,
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          type: data.type,
          category: data.category,
        })
        .returning();
      return inserted;
    }
  } catch (error: any) {
    console.error("Error in saveCalendarItem:", error);
    throw new Error(error.message || "Failed to save calendar item");
  }
}

export async function deleteCalendarItem(id: number) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      throw new AuthError("You must be signed in to delete calendar items.");
    }
    await db
      .delete(calendarItems)
      .where(and(eq(calendarItems.id, id), eq(calendarItems.userId, user.id)));
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteCalendarItem:", error);
    throw new Error(error.message || "Failed to delete calendar item");
  }
}

export async function updateCalendarItemDate(id: number, date: string | null) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      throw new AuthError("You must be signed in to move calendar items.");
    }
    const [updated] = await db
      .update(calendarItems)
      .set({ date })
      .where(and(eq(calendarItems.id, id), eq(calendarItems.userId, user.id)))
      .returning();
    return updated;
  } catch (error: any) {
    console.error("Error in updateCalendarItemDate:", error);
    throw new Error(error.message || "Failed to update item date");
  }
}
