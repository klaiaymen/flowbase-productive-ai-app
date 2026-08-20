import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, aiTemplates } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const templateId = Number.parseInt(id, 10);
  if (Number.isNaN(templateId)) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });

  const [existing] = await db
    .select()
    .from(aiTemplates)
    .where(and(eq(aiTemplates.id, templateId), eq(aiTemplates.clerkUserId, userId)));

  if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  if (!existing.isPinnedToSidebar) {
    const pinned = await db
      .select()
      .from(aiTemplates)
      .where(and(eq(aiTemplates.clerkUserId, userId), eq(aiTemplates.isPinnedToSidebar, true)));

    if (pinned.length >= 3) {
      return NextResponse.json(
        { success: false, limitReached: true, message: "Maximum 3 pinned templates." },
        { status: 409 }
      );
    }
  }

  const [updated] = await db
    .update(aiTemplates)
    .set({ isPinnedToSidebar: !existing.isPinnedToSidebar, updatedAt: new Date() })
    .where(and(eq(aiTemplates.id, templateId), eq(aiTemplates.clerkUserId, userId)))
    .returning();

  return NextResponse.json({ success: true, isPinnedToSidebar: updated.isPinnedToSidebar });
}
