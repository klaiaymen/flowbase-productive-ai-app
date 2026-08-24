import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pageComments, pages } from "@/db";
import { desc, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const pageId = Number.parseInt(id, 10);
  if (Number.isNaN(pageId)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

  const comments = await db
    .select()
    .from(pageComments)
    .where(eq(pageComments.pageId, pageId))
    .orderBy(desc(pageComments.createdAt));

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const pageId = Number.parseInt(id, 10);
  if (Number.isNaN(pageId)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

  const { content } = await request.json();
  if (!String(content || "").trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const [comment] = await db
    .insert(pageComments)
    .values({ pageId, clerkUserId: userId, content: content.trim() })
    .returning();

  const [page] = await db.select({ count: pages.commentsCount }).from(pages).where(eq(pages.id, pageId));
  const commentsCount = (page?.count ?? 0) + 1;
  await db.update(pages).set({ commentsCount }).where(eq(pages.id, pageId));

  return NextResponse.json({ ...comment, commentsCount }, { status: 201 });
}
