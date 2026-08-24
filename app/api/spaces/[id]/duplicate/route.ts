import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pages, spaces } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const spaceId = Number.parseInt(id, 10);
  if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

  const [original] = await db
    .select()
    .from(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, userId)));

  if (!original) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  const [newSpace] = await db
    .insert(spaces)
    .values({
      clerkUserId: userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      color: original.color,
    })
    .returning();

  const originalPages = await db.select().from(pages).where(eq(pages.spaceId, spaceId));
  if (originalPages.length > 0) {
    await db.insert(pages).values(
      originalPages.map((page) => ({
        spaceId: newSpace.id,
        clerkUserId: userId,
        name: page.name,
        description: page.description,
        template: page.template,
        content: page.content,
      }))
    );
  }

  return NextResponse.json(newSpace, { status: 201 });
}
