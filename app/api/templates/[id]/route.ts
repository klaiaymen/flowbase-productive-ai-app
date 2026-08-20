import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, aiTemplates } from "@/db";
import { and, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const templateId = Number.parseInt(id, 10);
  if (Number.isNaN(templateId)) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });

  const [template] = await db
    .select()
    .from(aiTemplates)
    .where(and(eq(aiTemplates.id, templateId), eq(aiTemplates.clerkUserId, userId)));

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const templateId = Number.parseInt(id, 10);
  if (Number.isNaN(templateId)) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });

  const body = await request.json();
  const [template] = await db
    .update(aiTemplates)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(aiTemplates.id, templateId), eq(aiTemplates.clerkUserId, userId)))
    .returning();

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const templateId = Number.parseInt(id, 10);
  if (Number.isNaN(templateId)) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });

  const [template] = await db
    .delete(aiTemplates)
    .where(and(eq(aiTemplates.id, templateId), eq(aiTemplates.clerkUserId, userId)))
    .returning();

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
