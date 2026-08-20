import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, notes } from "@/db";
import { desc, eq } from "drizzle-orm";

async function getUserId() {
  const { userId } = await auth();
  return userId;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(notes)
    .where(eq(notes.clerkUserId, userId))
    .orderBy(desc(notes.updatedAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const [note] = await db
    .insert(notes)
    .values({
      clerkUserId: userId,
      title: body.title || "Untitled",
      content: body.content || "",
      color: body.color || "rose",
      isPinned: body.isPinned ?? false,
    })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
