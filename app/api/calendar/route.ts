import { NextRequest, NextResponse } from "next/server";
import { db, calendarItems } from "@/db";
import { eq } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";

export async function GET() {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db
      .select()
      .from(calendarItems)
      .where(eq(calendarItems.userId, user.id))
      .orderBy(calendarItems.createdAt);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Calendar GET error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, date, time, type, category } = body;

    if (!title || !type || !category) {
      return NextResponse.json(
        { error: "title, type and category are required" },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(calendarItems)
      .values({
        userId: user.id,
        title,
        description: description ?? null,
        date: date ?? null,
        time: time ?? null,
        type,
        category,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Calendar POST error:", error);
    return NextResponse.json({ error: "Failed to create calendar item" }, { status: 500 });
  }
}
