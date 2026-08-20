import { NextRequest, NextResponse } from "next/server";
import { db, calendarItems } from "@/db";
import { and, eq } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(id: string) {
  const parsed = Number.parseInt(id, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const itemId = parseId(id);
    if (!itemId) {
      return NextResponse.json({ error: "Invalid calendar item id" }, { status: 400 });
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
      .update(calendarItems)
      .set({
        title,
        description: description ?? null,
        date: date ?? null,
        time: time ?? null,
        type,
        category,
      })
      .where(and(eq(calendarItems.id, itemId), eq(calendarItems.userId, user.id)))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Calendar item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Calendar PUT error:", error);
    return NextResponse.json({ error: "Failed to update calendar item" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const itemId = parseId(id);
    if (!itemId) {
      return NextResponse.json({ error: "Invalid calendar item id" }, { status: 400 });
    }

    const { date } = await request.json();

    const [item] = await db
      .update(calendarItems)
      .set({ date: date ?? null })
      .where(and(eq(calendarItems.id, itemId), eq(calendarItems.userId, user.id)))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Calendar item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Calendar PATCH error:", error);
    return NextResponse.json({ error: "Failed to update calendar item date" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const itemId = parseId(id);
    if (!itemId) {
      return NextResponse.json({ error: "Invalid calendar item id" }, { status: 400 });
    }

    const [item] = await db
      .delete(calendarItems)
      .where(and(eq(calendarItems.id, itemId), eq(calendarItems.userId, user.id)))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Calendar item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete calendar item" }, { status: 500 });
  }
}
