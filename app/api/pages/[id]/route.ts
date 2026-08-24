import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pages } from "@/db";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const pageId = Number.parseInt(id, 10);
  if (Number.isNaN(pageId)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const pageId = Number.parseInt(id, 10);
  if (Number.isNaN(pageId)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

  const body = await request.json();
  const [page] = await db
    .update(pages)
    .set({ ...body, clerkUserId: userId, updatedAt: new Date() })
    .where(eq(pages.id, pageId))
    .returning();

  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const pageId = Number.parseInt(id, 10);
  if (Number.isNaN(pageId)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

  const [page] = await db.delete(pages).where(eq(pages.id, pageId)).returning();
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
