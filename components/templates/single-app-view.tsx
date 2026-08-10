"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { updateTemplateData } from "@/app/templates/actions";
import { DynamicAppRenderer, type AppSchema } from "./dynamic-app-renderer";

interface Props {
  template: {
    id: number;
    appName: string;
    description: string | null;
    icon: string;
    color: string;
    layout: string;
    schemaJson: string;
    dataJson: string;
  };
}

export function SingleAppView({ template }: Props) {
  const [isPending, startTransition] = useTransition();

  const schema: AppSchema = (() => {
    try {
      return JSON.parse(template.schemaJson);
    } catch {
      return {
        appName: template.appName,
        description: template.description || "",
        icon: template.icon,
        color: template.color,
        sections: [],
      };
    }
  })();

  const initialData = (() => {
    try {
      return JSON.parse(template.dataJson || "{}");
    } catch {
      return {};
    }
  })();

  function handleDataChange(newData: Record<string, any>) {
    startTransition(async () => {
      try {
        await updateTemplateData(template.id, JSON.stringify(newData));
      } catch (err) {
        console.error("Failed to update template data:", err);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/templates"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors group"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Template Builder
        </Link>
      </div>

      {/* Dynamic App Renderer */}
      <DynamicAppRenderer
        schema={schema}
        initialData={initialData}
        onDataChange={handleDataChange}
        isSaving={isPending}
      />
    </div>
  );
}
