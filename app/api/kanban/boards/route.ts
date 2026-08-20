import { NextRequest, NextResponse } from "next/server";
import { db, kanbanBoardShares, kanbanBoards, kanbanColumns } from "@/db";
import { and, eq, exists } from "drizzle-orm";
import { syncCurrentUser } from "@/lib/auth/sync-user";

export async function GET() {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseSelection = {
      id: kanbanBoards.id,
      userId: kanbanBoards.userId,
      name: kanbanBoards.name,
      color: kanbanBoards.color,
      description: kanbanBoards.description,
      manualStatus: kanbanBoards.manualStatus,
      createdAt: kanbanBoards.createdAt,
    };

    if (user.role === "superuser" || user.role === "pmo") {
      const boards = await db.select(baseSelection).from(kanbanBoards).orderBy(kanbanBoards.createdAt);
      return NextResponse.json(boards);
    }

    if (user.role === "chef_projet") {
      const boards = await db
        .select(baseSelection)
        .from(kanbanBoards)
        .where(eq(kanbanBoards.userId, user.id))
        .orderBy(kanbanBoards.createdAt);
      return NextResponse.json(boards);
    }

    const boards = await db
      .select(baseSelection)
      .from(kanbanBoards)
      .where(
        exists(
          db
            .select()
            .from(kanbanBoardShares)
            .where(
              and(
                eq(kanbanBoardShares.boardId, kanbanBoards.id),
                eq(kanbanBoardShares.email, user.email)
              )
            )
        )
      )
      .orderBy(kanbanBoards.createdAt);

    return NextResponse.json(boards);
  } catch (error) {
    console.error("Kanban boards GET error:", error);
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await syncCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "member") {
      return NextResponse.json({ error: "Members cannot create boards" }, { status: 403 });
    }

    const { name, color } = await request.json();
    if (!name || !color) {
      return NextResponse.json({ error: "name and color are required" }, { status: 400 });
    }

    const [board] = await db
      .insert(kanbanBoards)
      .values({ userId: user.id, name, color })
      .returning();

    await db.insert(kanbanColumns).values([
      { boardId: board.id, name: "Todo", position: 0 },
      { boardId: board.id, name: "In progress", position: 1 },
      { boardId: board.id, name: "Done", position: 2 },
    ]);

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Kanban boards POST error:", error);
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}
