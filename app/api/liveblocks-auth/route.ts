import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, kanbanBoards, kanbanBoardShares, users } from "@/db";
import { eq, and, or, exists } from "drizzle-orm";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user from Clerk
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    
    if (!clerkUser || !email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch our DB user ID
    const [dbUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email));

    if (!dbUser) {
      return new NextResponse("User not synced", { status: 400 });
    }

    // 3. Parse the room ID from the request
    const { room } = await request.json();
    if (!room) {
      return new NextResponse("Room ID is required", { status: 400 });
    }

    // 4. Verify user has access to the board room
    // Match pattern: "kanban-board-${boardId}"
    const boardIdMatch = room.match(/^kanban-board-(\d+)$/);
    if (!boardIdMatch) {
      return new NextResponse("Invalid Room Format", { status: 400 });
    }

    const boardId = parseInt(boardIdMatch[1], 10);

    // Board is accessible if user is owner OR board is shared with user's email
    const accessibleBoards = await db
      .select({ id: kanbanBoards.id })
      .from(kanbanBoards)
      .leftJoin(kanbanBoardShares, eq(kanbanBoards.id, kanbanBoardShares.boardId))
      .where(
        and(
          eq(kanbanBoards.id, boardId),
          or(
            eq(kanbanBoards.userId, dbUser.id),
            eq(kanbanBoardShares.email, email.toLowerCase())
          )
        )
      );

    if (accessibleBoards.length === 0) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 5. Prepare Liveblocks session with user metadata
    const displayName = clerkUser.fullName || dbUser.name || email.split("@")[0];
    const session = liveblocks.prepareSession(dbUser.id.toString(), {
      userInfo: {
        name: displayName,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
        email: email,
      },
    });

    // 6. Allow full access to this room
    session.allow(room, session.FULL_ACCESS);

    // 7. Authorize and return token response
    const { status, body } = await session.authorize();
    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Liveblocks Auth Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
