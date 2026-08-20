import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, pages, spaces } from "@/db";
import { and, desc, eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

function initialContent(template: string, name: string) {
  if (template === "project-plan") return `<h1>${name}</h1><p><strong>Status:</strong> Planning</p>`;
  if (template === "meeting-notes") return `<h1>${name}</h1><h2>Agenda</h2><p></p>`;
  if (template === "prd") return `<h1>Product Requirement Document: ${name}</h1><p></p>`;
  if (template === "research-notes") return `<h1>Research Notes: ${name}</h1><p></p>`;
  if (template === "task-plan") return `<h1>Task Plan: ${name}</h1><p></p>`;
  return `<h1>${name}</h1><p></p>`;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const spaceId = Number.parseInt(id, 10);
  if (Number.isNaN(spaceId)) return NextResponse.json({ error: "Invalid space id" }, { status: 400 });

  const result = await db
    .select()
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), eq(pages.isArchived, false)))
    .orderBy(desc(pages.updatedAt));

  return NextResponse.json(result);
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
  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const template = body.template || "blank";
  const [page] = await db
    .insert(pages)
    .values({
      spaceId,
      clerkUserId: userId,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      template,
      content: body.content ?? initialContent(template, body.name.trim()),
    })
    .returning();

  await db.update(spaces).set({ updatedAt: new Date() }).where(eq(spaces.id, spaceId));
  return NextResponse.json(page, { status: 201 });
}
