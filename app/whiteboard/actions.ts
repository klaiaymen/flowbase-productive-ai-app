"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db, whiteboards, whiteboardShares } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const user = await currentUser();
  if (!user || !user.id) throw new Error("Unauthorized");
  return user;
}

export async function getWhiteboards() {
  const user = await requireUser();
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

  // Owned whiteboards
  const owned = await db
    .select({
      id: whiteboards.id,
      clerkUserId: whiteboards.clerkUserId,
      name: whiteboards.name,
      elements: whiteboards.elements,
      appState: whiteboards.appState,
      color: whiteboards.color,
      createdAt: whiteboards.createdAt,
      updatedAt: whiteboards.updatedAt,
      isShared: sql<boolean>`false`,
    })
    .from(whiteboards)
    .where(eq(whiteboards.clerkUserId, user.id));

  // Shared whiteboards
  let shared: any[] = [];
  if (email) {
    shared = await db
      .select({
        id: whiteboards.id,
        clerkUserId: whiteboards.clerkUserId,
        name: whiteboards.name,
        elements: whiteboards.elements,
        appState: whiteboards.appState,
        color: whiteboards.color,
        createdAt: whiteboards.createdAt,
        updatedAt: whiteboards.updatedAt,
        isShared: sql<boolean>`true`,
      })
      .from(whiteboards)
      .innerJoin(whiteboardShares, eq(whiteboards.id, whiteboardShares.whiteboardId))
      .where(eq(whiteboardShares.email, email));
  }

  const allMap = new Map();
  owned.forEach((b) => allMap.set(b.id, { ...b, isShared: false }));
  shared.forEach((b) => {
    if (!allMap.has(b.id)) {
      allMap.set(b.id, { ...b, isShared: true });
    }
  });

  return Array.from(allMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function createWhiteboard(name: string = "Untitled Whiteboard", color: string = "emerald") {
  const user = await requireUser();
  const [board] = await db
    .insert(whiteboards)
    .values({
      clerkUserId: user.id,
      name,
      color,
      elements: "[]",
      appState: "{}",
    })
    .returning();
  revalidatePath("/whiteboard");
  return { ...board, isShared: false };
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
  const user = await requireUser();
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

  const [board] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, id));

  if (!board) throw new Error("Whiteboard not found");

  const isOwner = board.clerkUserId === user.id;

  let isCollaborator = false;
  if (!isOwner && email) {
    const shares = await db
      .select()
      .from(whiteboardShares)
      .where(
        and(
          eq(whiteboardShares.whiteboardId, id),
          eq(whiteboardShares.email, email)
        )
      );
    isCollaborator = shares.length > 0;
  }

  if (!isOwner && !isCollaborator) {
    throw new Error("Forbidden");
  }

  const [updated] = await db
    .update(whiteboards)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(whiteboards.id, id))
    .returning();

  return { ...updated, isShared: !isOwner };
}

export async function deleteWhiteboard(id: number) {
  const user = await requireUser();
  await db
    .delete(whiteboards)
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkUserId, user.id)));
  revalidatePath("/whiteboard");
}

export async function duplicateWhiteboard(id: number) {
  const user = await requireUser();
  const [original] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, id));
  
  if (!original) throw new Error("Whiteboard not found");

  const [copy] = await db
    .insert(whiteboards)
    .values({
      clerkUserId: user.id,
      name: `${original.name} (Copy)`,
      color: original.color,
      elements: original.elements,
      appState: original.appState,
    })
    .returning();

  revalidatePath("/whiteboard");
  return { ...copy, isShared: false };
}

export async function getWhiteboardCollaborators(whiteboardId: number) {
  await requireUser();

  return db
    .select()
    .from(whiteboardShares)
    .where(eq(whiteboardShares.whiteboardId, whiteboardId))
    .orderBy(desc(whiteboardShares.createdAt));
}

export async function addWhiteboardCollaborator(whiteboardId: number, email: string) {
  const user = await requireUser();

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  // Check if current user is owner
  const [board] = await db
    .select()
    .from(whiteboards)
    .where(and(eq(whiteboards.id, whiteboardId), eq(whiteboards.clerkUserId, user.id)));

  if (!board) throw new Error("Only whiteboard owners can invite collaborators.");

  // Check if already shared
  const existing = await db
    .select()
    .from(whiteboardShares)
    .where(
      and(
        eq(whiteboardShares.whiteboardId, whiteboardId),
        eq(whiteboardShares.email, cleanEmail)
      )
    );

  if (existing.length > 0) {
    return existing[0];
  }

  const [newShare] = await db
    .insert(whiteboardShares)
    .values({
      whiteboardId,
      email: cleanEmail,
    })
    .returning();

  revalidatePath("/whiteboard");
  return newShare;
}

export async function removeWhiteboardCollaborator(whiteboardId: number, shareId: number) {
  const user = await requireUser();

  // Check if current user is owner
  const [board] = await db
    .select()
    .from(whiteboards)
    .where(and(eq(whiteboards.id, whiteboardId), eq(whiteboards.clerkUserId, user.id)));

  if (!board) throw new Error("Only whiteboard owners can remove collaborators.");

  await db
    .delete(whiteboardShares)
    .where(
      and(
        eq(whiteboardShares.id, shareId),
        eq(whiteboardShares.whiteboardId, whiteboardId)
      )
    );

  revalidatePath("/whiteboard");
}
