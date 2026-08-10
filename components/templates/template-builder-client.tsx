"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, Plus, ExternalLink, Pin, Trash2, CheckCircle2,
  AlertTriangle, Flame, Wallet, Utensils, GraduationCap, Dumbbell, Clock, LayoutGrid
} from "lucide-react";
import { saveAiTemplate, deleteAiTemplate, togglePinSidebar } from "@/app/templates/actions";
import { DynamicAppRenderer, type AppSchema } from "./dynamic-app-renderer";

const PRESET_IDEAS = [
  { label: "Habit Tracker", prompt: "Build a Habit Tracker app to track daily streaks, completion rates, and daily routines.", icon: Flame, color: "#F97316" },
  { label: "Budget Tracker", prompt: "Create a Personal Budget Tracker to monitor monthly income, expense logs, and saving caps.", icon: Wallet, color: "#10B981" },
  { label: "Meal Planner", prompt: "Design a Smart Meal & Nutrition Planner for daily calories, macros, hydration, and recipe logs.", icon: Utensils, color: "#F59E0B" },
  { label: "Study Planner", prompt: "Generate a Study & Course Planner for revision schedules, exam preparation, and study streaks.", icon: GraduationCap, color: "#6366F1" },
  { label: "Workout Log", prompt: "Create a Workout & Fitness Log app to track exercises, sets, reps, and weekly body goals.", icon: Dumbbell, color: "#EC4899" },
];

export interface AiTemplateItem {
  id: number;
  appName: string;
  description: string | null;
  icon: string;
  color: string;
  layout: string;
  schemaJson: string;
  dataJson: string;
  isPinnedToSidebar: boolean;
  createdAt: Date | string;
}

interface Props {
  initialApps: AiTemplateItem[];
}

export function TemplateBuilderClient({ initialApps }: Props) {
  const router = useRouter();
  const [apps, setApps] = useState<AiTemplateItem[]>(initialApps);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [warningModal, setWarningModal] = useState<string | null>(null);

  // Active generated preview (before saving or for instant review)
  const [generatedPreview, setGeneratedPreview] = useState<{
    schema: AppSchema;
    rawJsonStr: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setError("Please enter an app idea prompt.");
      return;
    }
    setError("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Generation failed.");
      }

      const appSchema: AppSchema = data.result;
      const schemaJson = JSON.stringify(appSchema);

      // Auto-save generated app to database
      const savedApp = await saveAiTemplate({
        appName: appSchema.appName,
        description: appSchema.description,
        icon: appSchema.icon,
        color: appSchema.color,
        layout: appSchema.layout || "single-page",
        schemaJson,
      });

      setApps((prev) => [savedApp as AiTemplateItem, ...prev]);
      setGeneratedPreview({ schema: appSchema, rawJsonStr: schemaJson });
      setPrompt("");
    } catch (err: any) {
      console.error("Error generating app:", err);
      setError(err.message || "Failed to generate app template. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectPreset(presetPrompt: string) {
    setPrompt(presetPrompt);
    setError("");
  }

  function handleDelete(id: number, appName: string) {
    if (!confirm(`Delete "${appName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteAiTemplate(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
      if (generatedPreview && apps.find((a) => a.id === id)) {
        setGeneratedPreview(null);
      }
    });
  }

  function handleTogglePin(id: number) {
    startTransition(async () => {
      try {
        const res = await togglePinSidebar(id);
        if (res.limitReached) {
          setWarningModal(res.message);
          return;
        }
        if (res.success) {
          setApps((prev) =>
            prev.map((a) => (a.id === id ? { ...a, isPinnedToSidebar: res.isPinnedToSidebar } : a))
          );
          router.refresh();
        }
      } catch (err: any) {
        setError(err.message || "Failed to pin sidebar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/90 bg-white/80 p-6 sm:p-8 shadow-[0_20px_60px_rgba(109,40,217,0.1)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-300/60">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-600">
                AI Powered
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              AI Template Builder
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Describe any single-page productivity app (Habit Tracker, Budget Tracker, Study Planner, Meal Prep), and AI will instantly generate an interactive mini-app layout for you!
        </p>

        {/* ── Prompt Input Form ── */}
        <form onSubmit={handleGenerate} className="mt-2 flex flex-col gap-3">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build a Habit Tracker to track daily streaks, water intake, and fitness routine..."
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 transition-all resize-none shadow-inner"
            />
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-3 bottom-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-fuchsia-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating App…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate App
                </>
              )}
            </button>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs font-semibold text-slate-500">Preset Ideas:</span>
            {PRESET_IDEAS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.prompt)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-fuchsia-300 hover:bg-fuchsia-50/50 transition-all shadow-xs"
                >
                  <Icon className="size-3.5" style={{ color: preset.color }} />
                  {preset.label}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600 border border-rose-100">
              {error}
            </p>
          )}
        </form>
      </header>

      {/* ── Generated App Preview Section (If Active) ── */}
      {generatedPreview && (
        <section className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-fuchsia-600" />
              <h2 className="text-lg font-bold text-slate-950">Newly Generated App Preview</h2>
            </div>
            <button
              type="button"
              onClick={() => setGeneratedPreview(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Close Preview
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-lg">
            <DynamicAppRenderer schema={generatedPreview.schema} />
          </div>
        </section>
      )}

      {/* ── Created Apps Grid Section ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Your Generated Mini-Apps</h2>
            <p className="text-xs text-slate-500">
              {apps.length} {apps.length === 1 ? "app" : "apps"} created · Click to open or pin to sidebar
            </p>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-slate-200 bg-white/50 text-center gap-3">
            <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-fuchsia-100 to-indigo-100 text-fuchsia-600 shadow-inner">
              <Sparkles className="size-8" />
            </div>
            <p className="text-base font-bold text-slate-800">No generated apps yet</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Type an app idea prompt above or pick a preset like "Habit Tracker" to build your first AI mini-app!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => {
              const themeColor = app.color || "#8B5CF6";
              return (
                <div
                  key={app.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div>
                    {/* Header: Icon + Sidebar Pin */}
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="grid size-11 place-items-center rounded-2xl text-white shadow-md"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Sparkles className="size-5" />
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Pin to Sidebar button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePin(app.id)}
                          disabled={isPending}
                          title={app.isPinnedToSidebar ? "Unpin from sidebar" : "Pin to sidebar (max 3)"}
                          className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            app.isPinnedToSidebar
                              ? "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          <Pin className={`size-3 ${app.isPinnedToSidebar ? "fill-fuchsia-600" : ""}`} />
                          {app.isPinnedToSidebar ? "Pinned" : "Pin"}
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(app.id, app.appName)}
                          disabled={isPending}
                          title="Delete app"
                          className="grid size-7 place-items-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* App Name & Description */}
                    <h3 className="font-bold text-slate-950 text-base leading-snug mb-1 truncate">
                      {app.appName}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 min-h-[2.25rem]">
                      {app.description || "Interactive AI generated application."}
                    </p>
                  </div>

                  {/* Footer & Open Link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="size-3" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>

                    <Link
                      href={`/templates/${app.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors group-hover:translate-x-0.5"
                    >
                      Open App
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Max 3 Sidebar Warning Modal ── */}
      {warningModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setWarningModal(null); }}
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500 mb-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-amber-100 text-amber-600">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sidebar Limit Reached</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {warningModal}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setWarningModal(null)}
                className="h-9 rounded-xl px-5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
