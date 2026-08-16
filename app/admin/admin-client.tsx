"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { User, Role } from "@/db/schema";
import { updateUserRole, deleteUser } from "@/lib/admin/actions";
import { Shield, ShieldAlert, Trash2, Save, CheckCircle2, UserCheck, Search, Users, ShieldCheck, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminClientProps {
  initialUsers: User[];
  currentUserId: number;
}

export function AdminClient({ initialUsers, currentUserId }: AdminClientProps) {
  const [userList, setUserList] = useState<User[]>(initialUsers);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, Role>>(
    initialUsers.reduce((acc, u) => ({ ...acc, [u.id]: u.role }), {})
  );
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleRoleChange = (userId: number, role: Role) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleSaveRole = async (user: User) => {
    const newRole = selectedRoles[user.id];
    if (newRole === user.role) return;

    setSavingId(user.id);
    setFeedback(null);
    try {
      await updateUserRole(user.id, newRole);
      setUserList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setFeedback({
        type: "success",
        message: `Updated role for ${user.email} to ${newRole}`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update user role",
      });
      setSelectedRoles((prev) => ({ ...prev, [user.id]: user.role }));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteUser) return;

    const userToDelete = confirmDeleteUser;
    setDeletingId(userToDelete.id);
    setFeedback(null);
    try {
      await deleteUser(userToDelete.id);
      setUserList((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setFeedback({
        type: "success",
        message: `Successfully deleted user ${userToDelete.email}`,
      });
      setConfirmDeleteUser(null);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to delete user",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = userList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case "superuser":
        return "bg-purple-100 text-purple-800 border-purple-200 font-bold";
      case "pmo":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold";
      case "chef_projet":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold";
      case "member":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 font-medium";
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
                <Shield className="size-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Manage application users, assign RBAC permissions, and clean up inactive accounts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-64 rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`flex items-center justify-between rounded-xl p-4 text-sm font-medium shadow-sm transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="size-5 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md">
            <div className="flex size-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Users className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{userList.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 shadow-sm backdrop-blur-md">
            <div className="flex size-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Crown className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-600">Superusers</p>
              <p className="text-2xl font-bold text-purple-950">
                {userList.filter((u) => u.role === "superuser").length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 shadow-sm backdrop-blur-md">
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-600">PMO Officers</p>
              <p className="text-2xl font-bold text-indigo-950">
                {userList.filter((u) => u.role === "pmo").length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm backdrop-blur-md">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <UserCheck className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600">Chefs de Projet</p>
              <p className="text-2xl font-bold text-emerald-950">
                {userList.filter((u) => u.role === "chef_projet").length}
              </p>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold">Name</th>
                  <th scope="col" className="px-6 py-4 font-bold">Email</th>
                  <th scope="col" className="px-6 py-4 font-bold">Role</th>
                  <th scope="col" className="px-6 py-4 font-bold">Created At</th>
                  <th scope="col" className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No users match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const hasChanged = selectedRoles[user.id] !== user.role;
                    const isSaving = savingId === user.id;
                    const isSuperuser = user.role === "superuser";

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{user.name || "Unnamed User"}</p>
                              {user.id === currentUserId && (
                                <span className="inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {user.email}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRoles[user.id] || user.role}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value as Role)
                              }
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-purple-200 ${getRoleBadgeStyle(
                                selectedRoles[user.id] || user.role
                              )}`}
                            >
                              <option value="superuser">superuser</option>
                              <option value="pmo">pmo</option>
                              <option value="chef_projet">chef_projet</option>
                              <option value="member">member</option>
                            </select>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-slate-500 text-xs">
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={hasChanged ? "default" : "outline"}
                              disabled={!hasChanged || isSaving}
                              onClick={() => handleSaveRole(user)}
                              className={
                                hasChanged
                                  ? "bg-purple-600 text-white hover:bg-purple-700"
                                  : "text-slate-400 opacity-60"
                              }
                            >
                              <Save className="mr-1.5 size-3.5" />
                              {isSaving ? "Saving..." : "Save"}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isSuperuser}
                              title={isSuperuser ? "Superusers cannot be deleted" : "Delete user"}
                              onClick={() => setConfirmDeleteUser(user)}
                              className={
                                isSuperuser
                                  ? "cursor-not-allowed text-slate-300 hover:bg-transparent"
                                  : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmDeleteUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100">
                  <ShieldAlert className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Delete User Account</h3>
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete user{" "}
                <strong className="text-slate-900">{confirmDeleteUser.email}</strong>?
                This action will permanently delete their account from Clerk and remove all associated database records.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteUser(null)}
                  disabled={deletingId !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  {deletingId !== null ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
