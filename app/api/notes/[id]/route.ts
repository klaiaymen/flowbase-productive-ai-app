import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, notes } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

async function getUserId() {
  const { userId } = await auth();
  return userId;
}

function parseId(id: string) {
  const parsed = Number.parseInt(id, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const noteId = parseId(id);
  if (!noteId) return NextResponse.json({ error: "Invalid note id" }, { status: 400 });

  const body = await request.json();
  const [note] = await db
    .update(notes)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.clerkUserId, userId)))
    .returning();

  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const noteId = parseId(id);
  if (!noteId) return NextResponse.json({ error: "Invalid note id" }, { status: 400 });

  const [note] = await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.clerkUserId, userId)))
    .returning();

  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
