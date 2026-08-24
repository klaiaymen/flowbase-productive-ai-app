import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, spaceMembers, spaces } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await context.params;
  const spaceId = Number.parseInt(id, 10);
  const parsedMemberId = Number.parseInt(memberId, 10);
  if (Number.isNaN(spaceId) || Number.isNaN(parsedMemberId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [space] = await db
    .select()
    .from(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, userId)));
  if (!space) return NextResponse.json({ error: "Only the owner can remove collaborators" }, { status: 403 });

  await db
    .delete(spaceMembers)
    .where(and(eq(spaceMembers.id, parsedMemberId), eq(spaceMembers.spaceId, spaceId)));

  return NextResponse.json({ success: true });
}
