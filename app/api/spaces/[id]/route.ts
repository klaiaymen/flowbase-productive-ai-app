import { NextRequest, NextResponse } from "next/server";
import { db, spaces } from "@/db";
import { eq } from "drizzle-orm";
import { requireSpaceOwner, statusFromError } from "@/lib/spaces/access";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const spaceId = Number.parseInt(id, 10);
    if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

    await requireSpaceOwner(spaceId);

    const body = await request.json();
    const [space] = await db
      .update(spaces)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(spaces.id, spaceId))
      .returning();

    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
    return NextResponse.json(space);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update space" }, { status: statusFromError(error) });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const spaceId = Number.parseInt(id, 10);
    if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

    await requireSpaceOwner(spaceId);

    const [space] = await db.delete(spaces).where(eq(spaces.id, spaceId)).returning();

    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete space" }, { status: statusFromError(error) });
  }
}
