import { requireRole } from "@/lib/auth/with-role";
import { getAllUsers } from "@/lib/admin/actions";
import { syncCurrentUser } from "@/lib/auth/sync-user";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  await requireRole("superuser");
  const currentUser = await syncCurrentUser();
  const users = await getAllUsers();

  return <AdminClient initialUsers={users} currentUserId={currentUser?.id ?? 0} />;
}
