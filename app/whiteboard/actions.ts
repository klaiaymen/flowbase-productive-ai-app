"use server";

import { auth } from "@clerk/nextjs/server";
import { db, whiteboards } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getWhiteboards() {
  const userId = await requireAuth();
  return db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.clerkUserId, userId))
    .orderBy(desc(whiteboards.updatedAt));
}

export async function createWhiteboard(name: string = "Untitled Whiteboard", color: string = "emerald") {
  const userId = await requireAuth();
  const [board] = await db
    .insert(whiteboards)
    .values({
      clerkUserId: userId,
      name,
      color,
      elements: "[]",
      appState: "{}",
    })
    .returning();
  revalidatePath("/whiteboard");
  return board;
}

export async function updateWhiteboard(
  id: number,
  data: Partial<{
    name: string;
    color: string;
    elements: string;
    appState: string;
  }>
) {
  const userId = await requireAuth();
  const [updated] = await db
    .update(whiteboards)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkUserId, userId)))
    .returning();
  return updated;
}

export async function deleteWhiteboard(id: number) {
  const userId = await requireAuth();
  await db
    .delete(whiteboards)
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkUserId, userId)));
  revalidatePath("/whiteboard");
}

export async function duplicateWhiteboard(id: number) {
  const userId = await requireAuth();
  const [original] = await db
    .select()
    .from(whiteboards)
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkUserId, userId)));
  
  if (!original) throw new Error("Whiteboard not found");

  const [copy] = await db
    .insert(whiteboards)
    .values({
      clerkUserId: userId,
      name: `${original.name} (Copy)`,
      color: original.color,
      elements: original.elements,
      appState: original.appState,
    })
    .returning();

  revalidatePath("/whiteboard");
  return copy;
}
