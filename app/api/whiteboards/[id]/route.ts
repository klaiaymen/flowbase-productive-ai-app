import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, whiteboards } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const whiteboardId = Number.parseInt(id, 10);
  if (Number.isNaN(whiteboardId)) return NextResponse.json({ error: "Invalid whiteboard id" }, { status: 400 });

  const body = await request.json();
  const [board] = await db
    .update(whiteboards)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(whiteboards.id, whiteboardId), eq(whiteboards.clerkUserId, userId)))
    .returning();

  if (!board) return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
  return NextResponse.json(board);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const whiteboardId = Number.parseInt(id, 10);
  if (Number.isNaN(whiteboardId)) return NextResponse.json({ error: "Invalid whiteboard id" }, { status: 400 });

  const [board] = await db
    .delete(whiteboards)
    .where(and(eq(whiteboards.id, whiteboardId), eq(whiteboards.clerkUserId, userId)))
    .returning();

  if (!board) return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
