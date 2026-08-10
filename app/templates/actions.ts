"use server";

import { db, aiTemplates } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

export async function getAiTemplates() {
  try {
    const clerkUserId = await requireAuth();
    return await db
      .select()
      .from(aiTemplates)
      .where(eq(aiTemplates.clerkUserId, clerkUserId))
      .orderBy(desc(aiTemplates.createdAt));
  } catch (error) {
    console.error("Error in getAiTemplates:", error);
    return [];
  }
}

export async function getAiTemplateById(id: number) {
  try {
    const clerkUserId = await requireAuth();
    const [template] = await db
      .select()
      .from(aiTemplates)
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.clerkUserId, clerkUserId)));
    return template || null;
  } catch (error) {
    console.error("Error in getAiTemplateById:", error);
    return null;
  }
}

export async function getPinnedAiTemplates() {
  try {
    const clerkUserId = await requireAuth();
    return await db
      .select({
        id: aiTemplates.id,
        appName: aiTemplates.appName,
        icon: aiTemplates.icon,
        color: aiTemplates.color,
      })
      .from(aiTemplates)
      .where(and(eq(aiTemplates.clerkUserId, clerkUserId), eq(aiTemplates.isPinnedToSidebar, true)))
      .orderBy(desc(aiTemplates.updatedAt))
      .limit(3);
  } catch (error) {
    console.error("Error in getPinnedAiTemplates:", error);
    return [];
  }
}

export async function saveAiTemplate(data: {
  appName: string;
  description: string;
  icon: string;
  color: string;
  layout: string;
  schemaJson: string;
  dataJson?: string;
}) {
  try {
    const clerkUserId = await requireAuth();

    const [newApp] = await db
      .insert(aiTemplates)
      .values({
        clerkUserId,
        appName: data.appName.trim(),
        description: data.description?.trim() || "",
        icon: data.icon || "Sparkles",
        color: data.color || "#8B5CF6",
        layout: data.layout || "single-page",
        schemaJson: data.schemaJson,
        dataJson: data.dataJson || "{}",
      })
      .returning();

    revalidatePath("/templates");
    return newApp;
  } catch (error: any) {
    console.error("Error in saveAiTemplate:", error);
    throw new Error(error.message || "Failed to save AI template");
  }
}

export async function deleteAiTemplate(id: number) {
  try {
    const clerkUserId = await requireAuth();
    await db
      .delete(aiTemplates)
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.clerkUserId, clerkUserId)));

    revalidatePath("/templates");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteAiTemplate:", error);
    throw new Error(error.message || "Failed to delete AI template");
  }
}

export async function togglePinSidebar(id: number) {
  try {
    const clerkUserId = await requireAuth();

    const [existing] = await db
      .select()
      .from(aiTemplates)
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.clerkUserId, clerkUserId)));

    if (!existing) throw new Error("App not found");

    if (!existing.isPinnedToSidebar) {
      // Check count of currently pinned
      const pinned = await db
        .select()
        .from(aiTemplates)
        .where(and(eq(aiTemplates.clerkUserId, clerkUserId), eq(aiTemplates.isPinnedToSidebar, true)));

      if (pinned.length >= 3) {
        return {
          success: false,
          limitReached: true,
          message: "You can pin a maximum of 3 apps to the sidebar. Unpin an existing app first.",
        };
      }
    }

    const [updated] = await db
      .update(aiTemplates)
      .set({
        isPinnedToSidebar: !existing.isPinnedToSidebar,
        updatedAt: new Date(),
      })
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.clerkUserId, clerkUserId)))
      .returning();

    revalidatePath("/templates");
    return { success: true, isPinnedToSidebar: updated.isPinnedToSidebar };
  } catch (error: any) {
    console.error("Error in togglePinSidebar:", error);
    throw new Error(error.message || "Failed to toggle sidebar pin");
  }
}

export async function updateTemplateData(id: number, dataJson: string) {
  try {
    const clerkUserId = await requireAuth();

    const [updated] = await db
      .update(aiTemplates)
      .set({
        dataJson,
        updatedAt: new Date(),
      })
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.clerkUserId, clerkUserId)))
      .returning();

    revalidatePath(`/templates/${id}`);
    return updated;
  } catch (error: any) {
    console.error("Error in updateTemplateData:", error);
    throw new Error(error.message || "Failed to update template data");
  }
}
