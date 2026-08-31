import { AppShell } from "@/components/app-shell";
import { SpacesClient } from "@/components/spaces/spaces-client";
import { getSpacesWithPageCount } from "@/app/spaces/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pages & Spaces — Flowbase",
  description: "Organize your documents using Spaces as top-level folders and Pages as individual documents.",
};

export const dynamic = "force-dynamic";


export default async function SpacesPage() {
  const spacesRaw = await getSpacesWithPageCount();

  // Shape the data for the client component
  const spaces = spacesRaw.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    color: s.color,
    isFavorited: s.isFavorited,
    isArchived: s.isArchived,
    pageCount: s.pageCount,
    memberEmails: s.memberEmails,
    updatedAt: s.updatedAt,
  }));

  return (
    <AppShell>
      <SpacesClient initialSpaces={spaces} />
    </AppShell>
  );
}
