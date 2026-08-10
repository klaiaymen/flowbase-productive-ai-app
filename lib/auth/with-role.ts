import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Role } from "@/db/schema";
import { syncCurrentUser } from "./sync-user";

export async function requireRole(...allowedRoles: Role[]): Promise<Role> {
  const { sessionClaims } = await auth();
  let role = (sessionClaims?.publicMetadata as { role?: Role })?.role;

  if (!role || !allowedRoles.includes(role)) {
    const dbUser = await syncCurrentUser();
    if (dbUser?.role) {
      role = dbUser.role;
    }
  }

  if (!role || !allowedRoles.includes(role)) {
    redirect("/unauthorized");
  }
  return role;
}
