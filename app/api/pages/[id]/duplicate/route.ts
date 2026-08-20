import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pages } from "@/db";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const pageId = Number.parseInt(id, 10);
  if (Number.isNaN(pageId)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

  const [original] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!original) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const [page] = await db
    .insert(pages)
    .values({
      spaceId: original.spaceId,
      clerkUserId: userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      template: original.template,
      content: original.content,
    })
    .returning();

  return NextResponse.json(page, { status: 201 });
}
