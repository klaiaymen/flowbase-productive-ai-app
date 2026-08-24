import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, spaceMembers, spaces, users } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const spaceId = Number.parseInt(id, 10);
  if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

  const members = await db.select().from(spaceMembers).where(eq(spaceMembers.spaceId, spaceId));
  const resolved = await Promise.all(
    members.map(async (member) => {
      const [user] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.email, member.email));
      return { ...member, hasAccount: !!user, userName: user?.name || null };
    })
  );

  return NextResponse.json(resolved);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const spaceId = Number.parseInt(id, 10);
  if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

  const [space] = await db
    .select()
    .from(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, userId)));
  if (!space) return NextResponse.json({ error: "Only the owner can invite collaborators" }, { status: 403 });

  const { email } = await request.json();
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const [member] = await db.insert(spaceMembers).values({ spaceId, email: cleanEmail }).returning();
  return NextResponse.json(member, { status: 201 });
}
