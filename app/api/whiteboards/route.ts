import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, whiteboards } from "@/db";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.clerkUserId, userId))
    .orderBy(desc(whiteboards.updatedAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const [board] = await db
    .insert(whiteboards)
    .values({
      clerkUserId: userId,
      name: body.name || "Untitled Whiteboard",
      color: body.color || "emerald",
      elements: body.elements || "[]",
      appState: body.appState || "{}",
    })
    .returning();

  return NextResponse.json(board, { status: 201 });
}
