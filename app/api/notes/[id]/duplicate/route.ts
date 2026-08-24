import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, notes } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const noteId = Number.parseInt(id, 10);
  if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid note id" }, { status: 400 });

  const [original] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.clerkUserId, userId)));

  if (!original) return NextResponse.json({ error: "Note not found" }, { status: 404 });

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

  return NextResponse.json(duplicate, { status: 201 });
}
