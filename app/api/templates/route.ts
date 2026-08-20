import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, aiTemplates } from "@/db";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await db
    .select()
    .from(aiTemplates)
    .where(eq(aiTemplates.clerkUserId, userId))
    .orderBy(desc(aiTemplates.createdAt));

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.appName || !body.schemaJson) {
    return NextResponse.json({ error: "appName and schemaJson are required" }, { status: 400 });
  }

  const [template] = await db
    .insert(aiTemplates)
    .values({
      clerkUserId: userId,
      appName: body.appName.trim(),
      description: body.description?.trim() || "",
      icon: body.icon || "Sparkles",
      color: body.color || "#8B5CF6",
      layout: body.layout || "single-page",
      schemaJson: body.schemaJson,
      dataJson: body.dataJson || "{}",
    })
    .returning();

  return NextResponse.json(template, { status: 201 });
}
