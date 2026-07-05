import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json([]);
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    // Retrieve users matching these database IDs
    const dbUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, ids));

    // Create lookup map
    const usersMap = new Map(dbUsers.map((u) => [u.id, u]));

    // Map user IDs back in the exact order requested
    const resolvedUsers = ids.map((id) => {
      const u = usersMap.get(id);
      if (!u) {
        return {
          name: "Anonymous User",
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=anon-${id}`,
        };
      }

      return {
        name: u.name || u.email.split("@")[0],
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.email)}`,
      };
    });

    return NextResponse.json(resolvedUsers);
  } catch (error) {
    console.error("Resolve Users Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
