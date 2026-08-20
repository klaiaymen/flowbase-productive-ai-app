import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, spaces } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const spaceId = Number.parseInt(id, 10);
  if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

  const body = await request.json();
  const [space] = await db
    .update(spaces)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, userId)))
    .returning();

  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
  return NextResponse.json(space);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const spaceId = Number.parseInt(id, 10);
  if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

  const [space] = await db
    .delete(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, userId)))
    .returning();

  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
