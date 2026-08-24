import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, pages, spaceMembers, spaces } from "@/db";

export type SpaceAccessLevel = "owner" | "member";

export class AuthError extends Error {
  status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export class AccessError extends Error {
  status = 403;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "AccessError";
  }
}

export async function requireSpaceUser() {
  const { userId } = await auth();
  if (!userId) throw new AuthError("You must be signed in.");

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;

  return { userId, email };
}

export async function getSpaceAccess(spaceId: number) {
  const user = await requireSpaceUser();

  const [space] = await db.select().from(spaces).where(eq(spaces.id, spaceId));
  if (!space) return null;

  if (space.clerkUserId === user.userId) {
    return { space, accessLevel: "owner" as const, user };
  }

  if (user.email) {
    const [member] = await db
      .select({ id: spaceMembers.id })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.email, user.email)));

    if (member) return { space, accessLevel: "member" as const, user };
  }

  return null;
}

export async function requireSpaceAccess(spaceId: number) {
  const access = await getSpaceAccess(spaceId);
  if (!access) throw new AccessError("Space not found or access denied");
  return access;
}

export async function requireSpaceOwner(spaceId: number) {
  const access = await requireSpaceAccess(spaceId);
  if (access.accessLevel !== "owner") {
    throw new AccessError("Only the space owner can perform this action");
  }
  return access;
}

export async function requirePageAccess(pageId: number) {
  await requireSpaceUser();

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page) throw new AccessError("Page not found or access denied");

  const access = await requireSpaceAccess(page.spaceId);
  return { ...access, page };
}

export function statusFromError(error: unknown) {
  if (error instanceof AuthError || error instanceof AccessError) {
    return error.status;
  }
  return 500;
}
