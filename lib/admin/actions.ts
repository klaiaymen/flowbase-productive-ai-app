"use server";

import { db, users, Role } from "@/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth/with-role";
import { clerkClient } from "@clerk/nextjs/server";

export async function getAllUsers() {
  await requireRole("superuser");
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, newRole: Role) {
  await requireRole("superuser");

  const allowedRoles: Role[] = ["superuser", "pmo", "chef_projet", "member"];
  if (!allowedRoles.includes(newRole)) {
    throw new Error("Invalid role specified");
  }

  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!targetUser) {
    throw new Error("User not found");
  }

  const [updatedUser] = await db
    .update(users)
    .set({ role: newRole })
    .where(eq(users.id, userId))
    .returning();

  try {
    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({
      emailAddress: [targetUser.email],
    });
    const clerkUser = Array.isArray(clerkUsersResponse)
      ? clerkUsersResponse[0]
      : clerkUsersResponse.data?.[0];

    if (clerkUser) {
      await client.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          role: newRole,
        },
      });
    }
  } catch (error) {
    console.error("Failed to sync role to Clerk publicMetadata:", error);
  }

  return updatedUser;
}

export async function deleteUser(userId: number) {
  await requireRole("superuser");

  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (targetUser.role === "superuser") {
    throw new Error("Cannot delete a superuser");
  }

  // Delete from DB (cascades to their data)
  await db.delete(users).where(eq(users.id, userId));

  // Remove from Clerk
  try {
    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({
      emailAddress: [targetUser.email],
    });
    const clerkUser = Array.isArray(clerkUsersResponse)
      ? clerkUsersResponse[0]
      : clerkUsersResponse.data?.[0];

    if (clerkUser) {
      await client.users.deleteUser(clerkUser.id);
    }
  } catch (error) {
    console.error("Failed to delete user from Clerk:", error);
  }

  return { success: true };
}
