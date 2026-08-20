import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pageComments, pages } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, commentId } = await context.params;
  const pageId = Number.parseInt(id, 10);
  const parsedCommentId = Number.parseInt(commentId, 10);
  if (Number.isNaN(pageId) || Number.isNaN(parsedCommentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [comment] = await db
    .delete(pageComments)
    .where(and(eq(pageComments.id, parsedCommentId), eq(pageComments.clerkUserId, userId)))
    .returning();

  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const [page] = await db.select({ count: pages.commentsCount }).from(pages).where(eq(pages.id, pageId));
  const commentsCount = Math.max(0, (page?.count ?? 1) - 1);
  await db.update(pages).set({ commentsCount }).where(eq(pages.id, pageId));

  return NextResponse.json({ success: true, commentsCount });
}
