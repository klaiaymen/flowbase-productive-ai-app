import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, whiteboards } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const whiteboardId = Number.parseInt(id, 10);
  if (Number.isNaN(whiteboardId)) return NextResponse.json({ error: "Invalid whiteboard id" }, { status: 400 });

  const [original] = await db
    .select()
    .from(whiteboards)
    .where(and(eq(whiteboards.id, whiteboardId), eq(whiteboards.clerkUserId, userId)));

  if (!original) return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });

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

  return NextResponse.json(copy, { status: 201 });
}
