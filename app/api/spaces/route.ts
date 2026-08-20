import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pages, spaceMembers, spaces } from "@/db";
import { and, desc, eq, sql } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allSpaces = await db
    .select()
    .from(spaces)
    .where(eq(spaces.clerkUserId, userId))
    .orderBy(desc(spaces.updatedAt));

  const result = await Promise.all(
    allSpaces.map(async (space) => {
      const [countResult] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(pages)
        .where(and(eq(pages.spaceId, space.id), eq(pages.isArchived, false)));

      const members = await db
        .select({ email: spaceMembers.email })
        .from(spaceMembers)
        .where(eq(spaceMembers.spaceId, space.id));

      return {
        ...space,
        pageCount: countResult?.count ?? 0,
        memberEmails: members.map((member) => member.email),
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name || !body.color) {
    return NextResponse.json({ error: "name and color are required" }, { status: 400 });
  }

  const [space] = await db
    .insert(spaces)
    .values({
      clerkUserId: userId,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      color: body.color,
    })
    .returning();

  return NextResponse.json(space, { status: 201 });
}
