import * as fs from "fs";
import * as path from "path";

// Load .env file for standalone CLI execution
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalsIdx = trimmed.indexOf("=");
      if (equalsIdx !== -1) {
        const key = trimmed.slice(0, equalsIdx).trim();
        const value = trimmed.slice(equalsIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

async function seedSuperuser() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/seed-superuser.ts <user_email>");
    process.exit(1);
  }

  const cleanEmail = email.trim().toLowerCase();
  console.log(`Searching for user with email: ${cleanEmail}...`);

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail));

  if (!dbUser) {
    console.error(`Error: User with email "${cleanEmail}" not found in database.`);
    console.error("Make sure the user has signed in at least once so their profile is synced.");
    process.exit(1);
  }

  // 1. Update role in DB
  const [updatedUser] = await db
    .update(users)
    .set({ role: "superuser" })
    .where(eq(users.id, dbUser.id))
    .returning();

  console.log(`Updated database role for ${cleanEmail} to 'superuser'.`);

  // 2. Sync to Clerk publicMetadata
  try {
    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({
      emailAddress: [cleanEmail],
    });
    const clerkUser = Array.isArray(clerkUsersResponse)
      ? clerkUsersResponse[0]
      : clerkUsersResponse.data?.[0];

    if (clerkUser) {
      await client.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          role: "superuser",
        },
      });
      console.log(`Synced role 'superuser' to Clerk publicMetadata for user ID ${clerkUser.id}.`);
    } else {
      console.warn(`Warning: Could not find user in Clerk with email ${cleanEmail}. Metadata sync skipped.`);
    }
  } catch (err) {
    console.error("Failed to sync role to Clerk publicMetadata:", err);
  }

  console.log(`Successfully seeded superuser: ${cleanEmail}`);
  process.exit(0);
}

seedSuperuser().catch((err) => {
  console.error("Unexpected error in seed-superuser script:", err);
  process.exit(1);
});
