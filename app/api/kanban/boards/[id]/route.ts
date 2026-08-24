import { NextRequest, NextResponse } from "next/server";
import { db, kanbanBoards } from "@/db";
import { and, eq } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(id: string) {
  const parsed = Number.parseInt(id, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const boardId = parseId(id);
    if (!boardId) {
      return NextResponse.json({ error: "Invalid board id" }, { status: 400 });
    }

    const [board] = await db.select().from(kanbanBoards).where(eq(kanbanBoards.id, boardId));
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const isAllowed =
      user.role === "chef_projet" ||
      user.role === "superuser" ||
      user.role === "pmo" ||
      board.userId === user.id;

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { description, manualStatus } = await request.json();
    const updatePayload: { description?: string; manualStatus?: string | null } = {};
    if (description !== undefined) updatePayload.description = description;
    if (manualStatus !== undefined) updatePayload.manualStatus = manualStatus;

    const [updatedBoard] = await db
      .update(kanbanBoards)
      .set(updatePayload)
      .where(eq(kanbanBoards.id, boardId))
      .returning();

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Kanban board PATCH error:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const boardId = parseId(id);
    if (!boardId) {
      return NextResponse.json({ error: "Invalid board id" }, { status: 400 });
    }

    const [board] = await db
      .delete(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, user.id)))
      .returning();

    if (!board) {
      return NextResponse.json({ error: "Board not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kanban board DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
