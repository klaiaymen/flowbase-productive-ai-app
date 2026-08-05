"use server";

import { db, spaces, pages, spaceMembers, users, pageComments } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

// ─── Spaces ──────────────────────────────────────────────────────────────────

export async function getSpaces() {
  try {
    const clerkUserId = await requireAuth();
    return await db
      .select()
      .from(spaces)
      .where(eq(spaces.clerkUserId, clerkUserId))
      .orderBy(desc(spaces.updatedAt));
  } catch (error) {
    console.error("Error in getSpaces:", error);
    return [];
  }
}

export async function getSpacesWithPageCount() {
  try {
    const clerkUserId = await requireAuth();

    const allSpaces = await db
      .select()
      .from(spaces)
      .where(eq(spaces.clerkUserId, clerkUserId))
      .orderBy(desc(spaces.updatedAt));

    const spacesWithCount = await Promise.all(
      allSpaces.map(async (space) => {
        const [countResult] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(pages)
          .where(and(eq(pages.spaceId, space.id), eq(pages.isArchived, false)));

        const memberRows = await db
          .select({ email: spaceMembers.email })
          .from(spaceMembers)
          .where(eq(spaceMembers.spaceId, space.id));

        return {
          ...space,
          pageCount: countResult?.count ?? 0,
          memberEmails: memberRows.map((m) => m.email),
        };
      })
    );

    return spacesWithCount;
  } catch (error) {
    console.error("Error in getSpacesWithPageCount:", error);
    return [];
  }
}


export async function createSpace(data: {
  name: string;
  description?: string;
  color: string;
}) {
  try {
    const clerkUserId = await requireAuth();

    const [space] = await db
      .insert(spaces)
      .values({
        clerkUserId,
        name: data.name.trim(),
        description: data.description?.trim() || "",
        color: data.color,
      })
      .returning();

    revalidatePath("/spaces");
    return space;
  } catch (error: any) {
    console.error("Error in createSpace:", error);
    throw new Error(error.message || "Failed to create space");
  }
}

export async function updateSpace(
  spaceId: number,
  data: Partial<{
    name: string;
    description: string;
    color: string;
    isFavorited: boolean;
    isArchived: boolean;
    lastOpenedAt: Date;
  }>
) {
  try {
    const clerkUserId = await requireAuth();

    const [updated] = await db
      .update(spaces)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, clerkUserId)))
      .returning();

    revalidatePath("/spaces");
    return updated;
  } catch (error: any) {
    console.error("Error in updateSpace:", error);
    throw new Error(error.message || "Failed to update space");
  }
}

export async function toggleSpaceFavorite(spaceId: number, current: boolean) {
  return updateSpace(spaceId, { isFavorited: !current });
}

export async function archiveSpace(spaceId: number) {
  return updateSpace(spaceId, { isArchived: true });
}

export async function unarchiveSpace(spaceId: number) {
  return updateSpace(spaceId, { isArchived: false });
}

export async function deleteSpace(spaceId: number) {
  try {
    const clerkUserId = await requireAuth();

    await db
      .delete(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, clerkUserId)));

    revalidatePath("/spaces");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteSpace:", error);
    throw new Error(error.message || "Failed to delete space");
  }
}

export async function duplicateSpace(spaceId: number) {
  try {
    const clerkUserId = await requireAuth();

    const [original] = await db
      .select()
      .from(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, clerkUserId)));

    if (!original) throw new Error("Space not found");

    const [newSpace] = await db
      .insert(spaces)
      .values({
        clerkUserId,
        name: `${original.name} (Copy)`,
        description: original.description,
        color: original.color,
      })
      .returning();

    // Duplicate all pages
    const originalPages = await db
      .select()
      .from(pages)
      .where(eq(pages.spaceId, spaceId));

    if (originalPages.length > 0) {
      await db.insert(pages).values(
        originalPages.map((p) => ({
          spaceId: newSpace.id,
          clerkUserId,
          name: p.name,
          description: p.description,
          template: p.template,
          content: p.content,
        }))
      );
    }

    revalidatePath("/spaces");
    return newSpace;
  } catch (error: any) {
    console.error("Error in duplicateSpace:", error);
    throw new Error(error.message || "Failed to duplicate space");
  }
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export async function getPages(spaceId: number) {
  try {
    await requireAuth();

    return await db
      .select()
      .from(pages)
      .where(and(eq(pages.spaceId, spaceId), eq(pages.isArchived, false)))
      .orderBy(desc(pages.updatedAt));
  } catch (error) {
    console.error("Error in getPages:", error);
    return [];
  }
}

function getTemplateInitialContent(template: string, name: string): string {
  switch (template) {
    case "project-plan":
      return `<h1>📋 ${name}</h1><p><strong>Status:</strong> Planning | <strong>Owner:</strong> Team</p><hr/><h2>1. Overview</h2><p>Write a brief summary of the project goals, background, and scope.</p><h2>2. Objectives & Key Results</h2><ul><li>Objective 1: Define key metric</li><li>Objective 2: Launch phase 1</li></ul><h2>3. Milestones & Timeline</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Requirements gathering & design review</div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Implementation & testing</div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Final release & deployment</div></li></ul><h2>4. Risks & Dependencies</h2><p>Document any potential blockers or cross-team dependencies.</p>`;
    case "meeting-notes":
      return `<h1>📝 ${name}</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Attendees:</strong> Participant 1, Participant 2</p><hr/><h2>Agenda</h2><ul><li>Topic 1: Project Updates</li><li>Topic 2: Blockers & Discussion</li><li>Topic 3: Next Steps</li></ul><h2>Discussion Notes</h2><p>Take detailed meeting notes here...</p><h2>Action Items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Follow up with team on design specs</div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Schedule next sync meeting</div></li></ul>`;
    case "prd":
      return `<h1>📐 Product Requirement Document: ${name}</h1><p><strong>Author:</strong> Product Manager | <strong>Target Date:</strong> TBD</p><hr/><h2>Problem Statement</h2><p>Describe the user pain point or opportunity we are addressing.</p><h2>Target Audience</h2><p>Who is this feature built for?</p><h2>User Stories & Requirements</h2><ol><li>As a user, I want to... so that...</li><li>As an admin, I want to... so that...</li></ol><h2>Out of Scope</h2><p>List items explicitly not included in this iteration.</p><h2>Success Metrics</h2><p>How will we measure feature success after launch?</p>`;
    case "research-notes":
      return `<h1>🔬 Research Notes: ${name}</h1><p><strong>Topic:</strong> Competitive / User Research | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p><hr/><h2>Research Objective</h2><p>What question are we trying to answer?</p><h2>Key Findings</h2><ul><li>Finding 1: High user demand for productivity tools</li><li>Finding 2: Need for seamless collaboration</li></ul><h2>Sources & References</h2><p>Links to studies, interview notes, or external benchmarks.</p><h2>Recommendations</h2><p>Based on findings, what actions should we take next?</p>`;
    case "task-plan":
      return `<h1>✅ Task Plan: ${name}</h1><hr/><h2>High Priority Tasks</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Setup infrastructure & base components</div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Implement main workflows</div></li></ul><h2>Medium Priority Tasks</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Add error handling & validation</div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"/><span></span></label><div>Write documentation & tests</div></li></ul><h2>Completed Tasks</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked/><span></span></label><div>Initial kick-off meeting</div></li></ul>`;
    case "blank":
    default:
      return `<h1>${name}</h1><p></p>`;
  }
}

export async function createPage(data: {
  spaceId: number;
  name: string;
  template?: string;
  description?: string;
}) {
  try {
    const clerkUserId = await requireAuth();
    const templateKey = data.template || "blank";
    const initialContent = getTemplateInitialContent(templateKey, data.name.trim());

    const [page] = await db
      .insert(pages)
      .values({
        spaceId: data.spaceId,
        clerkUserId,
        name: data.name.trim(),
        description: data.description?.trim() || "",
        template: templateKey,
        content: initialContent,
      })
      .returning();

    // Update the parent space's updatedAt
    await db
      .update(spaces)
      .set({ updatedAt: new Date() })
      .where(eq(spaces.id, data.spaceId));

    revalidatePath("/spaces");
    return page;
  } catch (error: any) {
    console.error("Error in createPage:", error);
    throw new Error(error.message || "Failed to create page");
  }
}


export async function updatePage(
  pageId: number,
  data: Partial<{
    name: string;
    description: string;
    template: string;
    content: string;
    isFavorited: boolean;
    isArchived: boolean;
    commentsCount: number;
    linkedTaskIds: string;
    spaceId: number;
  }>
) {
  try {
    const clerkUserId = await requireAuth();

    const [updated] = await db
      .update(pages)
      .set({ ...data, clerkUserId, updatedAt: new Date() })
      .where(eq(pages.id, pageId))
      .returning();

    revalidatePath("/spaces");
    return updated;
  } catch (error: any) {
    console.error("Error in updatePage:", error);
    throw new Error(error.message || "Failed to update page");
  }
}

export async function togglePageFavorite(pageId: number, current: boolean) {
  return updatePage(pageId, { isFavorited: !current });
}

export async function archivePage(pageId: number) {
  return updatePage(pageId, { isArchived: true });
}

export async function duplicatePage(pageId: number) {
  try {
    const clerkUserId = await requireAuth();

    const [original] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId));

    if (!original) throw new Error("Page not found");

    const [newPage] = await db
      .insert(pages)
      .values({
        spaceId: original.spaceId,
        clerkUserId,
        name: `${original.name} (Copy)`,
        description: original.description,
        template: original.template,
        content: original.content,
      })
      .returning();

    revalidatePath("/spaces");
    return newPage;
  } catch (error: any) {
    console.error("Error in duplicatePage:", error);
    throw new Error(error.message || "Failed to duplicate page");
  }
}

export async function deletePage(pageId: number) {
  try {
    await requireAuth();

    await db.delete(pages).where(eq(pages.id, pageId));

    revalidatePath("/spaces");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deletePage:", error);
    throw new Error(error.message || "Failed to delete page");
  }
}

// ─── Space Members ────────────────────────────────────────────────────────────

export async function getSpaceMembers(spaceId: number) {
  try {
    const clerkUserId = await requireAuth();

    const members = await db
      .select()
      .from(spaceMembers)
      .where(eq(spaceMembers.spaceId, spaceId))
      .orderBy(spaceMembers.createdAt);

    // Resolve whether each member has a Flowbase account
    const resolved = await Promise.all(
      members.map(async (m) => {
        const [userRow] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.email, m.email));
        return {
          ...m,
          hasAccount: !!userRow,
          userName: userRow?.name || null,
        };
      })
    );

    return resolved;
  } catch (error) {
    console.error("Error in getSpaceMembers:", error);
    return [];
  }
}

export async function addSpaceMember(spaceId: number, email: string) {
  try {
    const clerkUserId = await requireAuth();

    // Verify the user owns this space
    const [space] = await db
      .select()
      .from(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, clerkUserId)));

    if (!space) throw new Error("Only the space owner can invite collaborators");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Email is required");

    // Check for duplicates
    const [existing] = await db
      .select()
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.email, cleanEmail)));

    if (existing) throw new Error("This email is already a collaborator");

    const [newMember] = await db
      .insert(spaceMembers)
      .values({ spaceId, email: cleanEmail })
      .returning();

    const [userRow] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, cleanEmail));

    return {
      ...newMember,
      hasAccount: !!userRow,
      userName: userRow?.name || null,
    };
  } catch (error: any) {
    console.error("Error in addSpaceMember:", error);
    throw new Error(error.message || "Failed to add collaborator");
  }
}

export async function removeSpaceMember(spaceId: number, memberId: number) {
  try {
    const clerkUserId = await requireAuth();

    const [space] = await db
      .select()
      .from(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, clerkUserId)));

    if (!space) throw new Error("Only the space owner can remove collaborators");

    await db
      .delete(spaceMembers)
      .where(and(eq(spaceMembers.id, memberId), eq(spaceMembers.spaceId, spaceId)));

    return { success: true };
  } catch (error: any) {
    console.error("Error in removeSpaceMember:", error);
    throw new Error(error.message || "Failed to remove collaborator");
  }
}

export async function movePage(pageId: number, targetSpaceId: number) {
  try {
    const clerkUserId = await requireAuth();

    // Verify user owns target space
    const [targetSpace] = await db
      .select()
      .from(spaces)
      .where(and(eq(spaces.id, targetSpaceId), eq(spaces.clerkUserId, clerkUserId)));

    if (!targetSpace) throw new Error("Target space not found");

    const [updated] = await db
      .update(pages)
      .set({ spaceId: targetSpaceId, updatedAt: new Date() })
      .where(eq(pages.id, pageId))
      .returning();

    revalidatePath("/spaces");
    return updated;
  } catch (error: any) {
    console.error("Error in movePage:", error);
    throw new Error(error.message || "Failed to move page");
  }
}

// ─── Page Comments ────────────────────────────────────────────────────────────

export async function getPageComments(pageId: number) {
  try {
    await requireAuth();

    const comments = await db
      .select()
      .from(pageComments)
      .where(eq(pageComments.pageId, pageId))
      .orderBy(desc(pageComments.createdAt));

    return comments;
  } catch (error) {
    console.error("Error in getPageComments:", error);
    return [];
  }
}

export async function addPageComment(pageId: number, content: string) {
  try {
    const clerkUserId = await requireAuth();
    if (!content.trim()) throw new Error("Comment content cannot be empty");

    const [comment] = await db
      .insert(pageComments)
      .values({
        pageId,
        clerkUserId,
        content: content.trim(),
      })
      .returning();

    // Increment commentsCount in page
    const [pageRow] = await db.select({ count: pages.commentsCount }).from(pages).where(eq(pages.id, pageId));
    const newCount = (pageRow?.count ?? 0) + 1;

    await db.update(pages).set({ commentsCount: newCount }).where(eq(pages.id, pageId));

    revalidatePath("/spaces");
    return { ...comment, commentsCount: newCount };
  } catch (error: any) {
    console.error("Error in addPageComment:", error);
    throw new Error(error.message || "Failed to add comment");
  }
}

export async function deletePageComment(commentId: number, pageId: number) {
  try {
    const clerkUserId = await requireAuth();

    await db
      .delete(pageComments)
      .where(and(eq(pageComments.id, commentId), eq(pageComments.clerkUserId, clerkUserId)));

    // Decrement commentsCount in page
    const [pageRow] = await db.select({ count: pages.commentsCount }).from(pages).where(eq(pages.id, pageId));
    const newCount = Math.max(0, (pageRow?.count ?? 1) - 1);

    await db.update(pages).set({ commentsCount: newCount }).where(eq(pages.id, pageId));

    revalidatePath("/spaces");
    return { success: true, commentsCount: newCount };
  } catch (error: any) {
    console.error("Error in deletePageComment:", error);
    throw new Error(error.message || "Failed to delete comment");
  }
}

