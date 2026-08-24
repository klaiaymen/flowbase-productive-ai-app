import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, aiTemplates } from "@/db";
import { and, desc, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await db
    .select({
      id: aiTemplates.id,
      appName: aiTemplates.appName,
      icon: aiTemplates.icon,
      color: aiTemplates.color,
    })
    .from(aiTemplates)
    .where(and(eq(aiTemplates.clerkUserId, userId), eq(aiTemplates.isPinnedToSidebar, true)))
    .orderBy(desc(aiTemplates.updatedAt))
    .limit(3);

  return NextResponse.json(templates);
}
