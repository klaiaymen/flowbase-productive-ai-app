import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { db, users } from "@/db";

function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return user.fullName || fullName || user.username || null;
}

export async function syncCurrentUser() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!email) {
    return null;
  }

  const name = getDisplayName(user);

  const [savedUser] = await db
    .insert(users)
    .values({ email, name })
    .onConflictDoUpdate({
      target: users.email,
      set: { name },
    })
    .returning();

  return savedUser;
}
