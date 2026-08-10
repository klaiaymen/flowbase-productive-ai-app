import { AppShell } from "@/components/app-shell";
import { getAiTemplateById } from "../actions";
import { SingleAppView } from "@/components/templates/single-app-view";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const template = await getAiTemplateById(Number(id));
  return {
    title: template ? `${template.appName} — Flowbase Mini-App` : "Mini-App — Flowbase",
  };
}

export default async function SingleTemplatePage({ params }: Props) {
  const { id } = await params;
  const template = await getAiTemplateById(Number(id));

  if (!template) {
    notFound();
  }

  return (
    <AppShell>
      <SingleAppView template={template} />
    </AppShell>
  );
}
