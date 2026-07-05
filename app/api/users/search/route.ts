import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    // Search users by name or email
    const dbUsers = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        or(
          ilike(users.email, `%${query}%`),
          ilike(users.name, `%${query}%`)
        )
      )
      .limit(10);

    // Return list of user ID strings as expected by Liveblocks MentionSuggestions
    const userIds = dbUsers.map((u) => u.id.toString());
    return NextResponse.json(userIds);
  } catch (error) {
    console.error("Search Users Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
