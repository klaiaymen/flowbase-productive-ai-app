import { AppShell } from "@/components/app-shell";
import { TemplateBuilderClient } from "@/components/templates/template-builder-client";
import { getAiTemplates } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Template Builder — Flowbase",
  description: "Generate custom single-page mini-apps like Habit Trackers, Budget Trackers, and Study Planners using AI.",
};

export const dynamic = "force-dynamic";


export default async function TemplatesPage() {
  const appsRaw = await getAiTemplates();

  const apps = appsRaw.map((a) => ({
    id: a.id,
    appName: a.appName,
    description: a.description,
    icon: a.icon,
    color: a.color,
    layout: a.layout,
    schemaJson: a.schemaJson,
    dataJson: a.dataJson,
    isPinnedToSidebar: a.isPinnedToSidebar,
    createdAt: a.createdAt,
  }));

  return (
    <AppShell>
      <TemplateBuilderClient initialApps={apps} />
    </AppShell>
  );
}
