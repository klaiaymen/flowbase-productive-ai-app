import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pages, spaceMembers, spaces } from "@/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireSpaceUser, statusFromError } from "@/lib/spaces/access";

export async function GET() {
  try {
    const { userId, email } = await requireSpaceUser();

    const ownedSpaces = await db
      .select()
      .from(spaces)
      .where(eq(spaces.clerkUserId, userId))
      .orderBy(desc(spaces.updatedAt));

    let sharedSpaces: typeof ownedSpaces = [];
    if (email) {
      const memberRows = await db
        .select({ spaceId: spaceMembers.spaceId })
        .from(spaceMembers)
        .where(eq(spaceMembers.email, email));

      const sharedIds = memberRows.map((member) => member.spaceId);
      if (sharedIds.length > 0) {
        sharedSpaces = await db.select().from(spaces).where(inArray(spaces.id, sharedIds));
      }
    }

    const deduped = new Map<number, (typeof ownedSpaces)[number]>();
    [...ownedSpaces, ...sharedSpaces].forEach((space) => deduped.set(space.id, space));
    const allSpaces = Array.from(deduped.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

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
          accessLevel: space.clerkUserId === userId ? "owner" : "member",
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load spaces" }, { status: statusFromError(error) });
  }
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
