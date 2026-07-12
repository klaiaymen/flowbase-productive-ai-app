"use server";

import { auth } from "@clerk/nextjs/server";
import { db, notes } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getNotes() {
  const userId = await requireAuth();
  return db
    .select()
    .from(notes)
    .where(eq(notes.clerkUserId, userId))
    .orderBy(desc(notes.updatedAt));
}

export async function createNote() {
  const userId = await requireAuth();
  const [note] = await db
    .insert(notes)
    .values({ clerkUserId: userId, title: "Untitled", content: "" })
    .returning();
  revalidatePath("/notes");
  return note;
}

export async function updateNote(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    color: string;
    isPinned: boolean;
  }>
) {
  const userId = await requireAuth();
  const [note] = await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.clerkUserId, userId)))
    .returning();
  return note;
}

export async function trashNote(id: number) {
  const userId = await requireAuth();
  await db
    .update(notes)
    .set({ isTrashed: true, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.clerkUserId, userId)));
  revalidatePath("/notes");
}

export async function restoreNote(id: number) {
  const userId = await requireAuth();
  await db
    .update(notes)
    .set({ isTrashed: false, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.clerkUserId, userId)));
  revalidatePath("/notes");
}

export async function permanentlyDeleteNote(id: number) {
  const userId = await requireAuth();
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.clerkUserId, userId)));
  revalidatePath("/notes");
}

export async function duplicateNote(id: number) {
  const userId = await requireAuth();
  const [original] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.clerkUserId, userId)));
  if (!original) throw new Error("Note not found");
  const [duplicate] = await db
    .insert(notes)
    .values({
      clerkUserId: userId,
      title: `${original.title} (copy)`,
      content: original.content,
      color: original.color,
      isPinned: false,
      isTrashed: false,
    })
    .returning();
  revalidatePath("/notes");
  return duplicate;
}
