"use client";

import { useState } from "react";
import {
  Flame, Wallet, Utensils, GraduationCap, CheckSquare, Activity, Target,
  Calendar, Sparkles, Dumbbell, BookOpen, Clock, Heart, Compass, PiggyBank,
  CreditCard, TrendingUp, Droplets, Plus, Trash2, CheckCircle2, Circle,
  RotateCcw, Code, Download, FileText, ChevronRight, X
} from "lucide-react";

// Helper map for dynamic Lucide icon rendering
const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Wallet, Utensils, GraduationCap, CheckSquare, Activity, Target,
  Calendar, Sparkles, Dumbbell, BookOpen, Clock, Heart, Compass, PiggyBank,
  CreditCard, TrendingUp, Droplets, CheckCircle2, Circle, FileText
};

function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || Sparkles;
}

export interface StatsItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  icon?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category?: string;
}

export interface SectionBlock {
  id: string;
  type: "stats-grid" | "progress-bar" | "checklist" | "data-table";
  title: string;
  items?: any[];
  columns?: string[];
  rows?: Record<string, any>[];
  label?: string;
  percentage?: number;
}

export interface AppSchema {
  appName: string;
  description: string;
  icon: string;
  color: string;
  layout?: string;
  sections: SectionBlock[];
  sampleData?: Record<string, any>;
}

interface Props {
  schema: AppSchema;
  initialData?: Record<string, any>;
  onDataChange?: (newData: Record<string, any>) => void;
  isSaving?: boolean;
}

export function DynamicAppRenderer({ schema, initialData = {}, onDataChange, isSaving }: Props) {
  // Local state initialized with user's saved data or defaults from schema
  const [appData, setAppData] = useState<Record<string, any>>(() => {
    // If initialData exists and has checklist/table state, use it
    if (Object.keys(initialData).length > 0) return initialData;

    // Otherwise extract default checklist completion states and table rows
    const defaults: Record<string, any> = {};
    schema.sections.forEach((sec) => {
      if (sec.type === "checklist" && sec.items) {
        defaults[`checklist_${sec.id}`] = sec.items.reduce((acc, item) => {
          acc[item.id] = item.completed ?? false;
          return acc;
        }, {} as Record<string, boolean>);
      }
      if (sec.type === "data-table" && sec.rows) {
        defaults[`table_${sec.id}`] = sec.rows;
      }
    });
    return defaults;
  });

  const [showAddRowModal, setShowAddRowModal] = useState<SectionBlock | null>(null);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [showJsonModal, setShowJsonModal] = useState(false);

  const AppIcon = getIconComponent(schema.icon);
  const themeColor = schema.color || "#8B5CF6";

  function updateDataState(key: string, value: any) {
    const updated = { ...appData, [key]: value };
    setAppData(updated);
    if (onDataChange) onDataChange(updated);
  }

  function handleToggleChecklist(sectionId: string, itemId: string) {
    const key = `checklist_${sectionId}`;
    const currentList = appData[key] || {};
    const updatedList = { ...currentList, [itemId]: !currentList[itemId] };
    updateDataState(key, updatedList);
  }

  function handleAddTableRow(section: SectionBlock) {
    if (!section.columns) return;
    const key = `table_${section.id}`;
    const currentRows = appData[key] || section.rows || [];
    const newEntry = { id: `user_row_${Date.now()}`, ...newRowData };
    const updatedRows = [newEntry, ...currentRows];
    updateDataState(key, updatedRows);

    setNewRowData({});
    setShowAddRowModal(null);
  }

  function handleDeleteTableRow(sectionId: string, rowId: string) {
    const key = `table_${sectionId}`;
    const currentRows = appData[key] || [];
    const updatedRows = currentRows.filter((r: any) => r.id !== rowId);
    updateDataState(key, updatedRows);
  }

  function handleResetData() {
    if (!confirm("Reset all mini-app data back to original defaults?")) return;
    const defaults: Record<string, any> = {};
    schema.sections.forEach((sec) => {
      if (sec.type === "checklist" && sec.items) {
        defaults[`checklist_${sec.id}`] = sec.items.reduce((acc, item) => {
          acc[item.id] = item.completed ?? false;
          return acc;
        }, {} as Record<string, boolean>);
      }
      if (sec.type === "data-table" && sec.rows) {
        defaults[`table_${sec.id}`] = sec.rows;
      }
    });
    setAppData(defaults);
    if (onDataChange) onDataChange(defaults);
  }

  function handleExportJson() {
    const dataStr = JSON.stringify({ schema, userState: appData }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schema.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      {/* ── Mini App Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${themeColor} 0%, #1e1b4b 100%)`,
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner shrink-0">
              <AppIcon className="size-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                  Interactive Mini-App
                </span>
                {isSaving && (
                  <span className="text-[11px] font-semibold text-white/80 animate-pulse">
                    Saving edits…
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {schema.appName}
              </h1>
              <p className="mt-1 text-sm text-white/80 max-w-xl leading-relaxed">
                {schema.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 backdrop-blur-md transition-all shadow-sm"
              title="View App JSON Schema"
            >
              <Code className="size-3.5" />
              JSON
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 backdrop-blur-md transition-all shadow-sm"
              title="Export Data"
            >
              <Download className="size-3.5" />
              Export
            </button>
            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 backdrop-blur-md transition-all shadow-sm"
              title="Reset Data"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* ── Render Dynamic Sections ── */}
      <div className="grid gap-6">
        {schema.sections.map((section) => {
          if (section.type === "stats-grid" && section.items) {
            return (
              <div key={section.id} className="flex flex-col gap-3">
                {section.title && (
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                    {section.title}
                  </h3>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  {section.items.map((item: StatsItem) => {
                    const ItemIcon = item.icon ? getIconComponent(item.icon) : Activity;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                          <div
                            className="grid size-8 place-items-center rounded-xl text-white shadow-xs"
                            style={{ backgroundColor: themeColor }}
                          >
                            <ItemIcon className="size-4" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-slate-900">{item.value}</span>
                          {item.change && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {item.change}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (section.type === "progress-bar") {
            const pct = section.percentage ?? 50;
            return (
              <div
                key={section.id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                  <span className="text-xs font-bold text-slate-700">{pct}%</span>
                </div>
                {section.label && (
                  <p className="text-xs text-slate-500">{section.label}</p>
                )}
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: themeColor }}
                  />
                </div>
              </div>
            );
          }

          if (section.type === "checklist" && section.items) {
            const key = `checklist_${section.id}`;
            const stateObj = appData[key] || {};
            const totalCount = section.items.length;
            const completedCount = section.items.filter(
              (item: ChecklistItem) => stateObj[item.id] ?? item.completed
            ).length;
            const calculatedPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={section.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                    <p className="text-xs text-slate-500">
                      {completedCount} of {totalCount} completed ({calculatedPct}%)
                    </p>
                  </div>
                  <div className="w-32 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${calculatedPct}%`, backgroundColor: themeColor }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {section.items.map((item: ChecklistItem) => {
                    const isChecked = stateObj[item.id] ?? item.completed ?? false;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklist(section.id, item.id)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 cursor-pointer transition-all ${
                          isChecked
                            ? "border-slate-100 bg-slate-50/80 text-slate-400 line-through"
                            : "border-slate-200/70 bg-white text-slate-800 hover:border-violet-200 hover:bg-violet-50/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className={`grid size-5 place-items-center rounded-lg transition-colors ${
                              isChecked ? "text-emerald-500" : "text-slate-300"
                            }`}
                          >
                            {isChecked ? <CheckCircle2 className="size-5 fill-emerald-100" /> : <Circle className="size-5" />}
                          </button>
                          <span className="text-sm font-medium truncate">{item.label}</span>
                        </div>

                        {item.category && (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-500">
                            {item.category}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (section.type === "data-table" && section.columns) {
            const key = `table_${section.id}`;
            const rows = appData[key] || section.rows || [];

            return (
              <div
                key={section.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddRowModal(section)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-90"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Plus className="size-3.5" />
                    Add Entry
                  </button>
                </div>

                {rows.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No entries logged yet. Click "+ Add Entry" to add one!
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                        <tr>
                          {section.columns.map((col) => (
                            <th key={col} className="px-4 py-3">{col}</th>
                          ))}
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {rows.map((row: any, idx: number) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            {section.columns!.map((col) => (
                              <td key={col} className="px-4 py-3 font-medium">{row[col] || "-"}</td>
                            ))}
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteTableRow(section.id, row.id)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                title="Delete row"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── Add Table Row Modal ── */}
      {showAddRowModal && showAddRowModal.columns && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddRowModal(null); }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Entry — {showAddRowModal.title}</h3>
              <button
                type="button"
                onClick={() => setShowAddRowModal(null)}
                className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTableRow(showAddRowModal);
              }}
              className="flex flex-col gap-3"
            >
              {showAddRowModal.columns.map((col) => (
                <div key={col} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">{col}</label>
                  <input
                    type="text"
                    required
                    value={newRowData[col] || ""}
                    onChange={(e) => setNewRowData({ ...newRowData, [col]: e.target.value })}
                    placeholder={`Enter ${col}…`}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(null)}
                  className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View JSON Schema Modal ── */}
      {showJsonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowJsonModal(false); }}
        >
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Code className="size-5 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900">App JSON Schema</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <pre className="max-h-96 overflow-y-auto rounded-2xl bg-slate-950 p-4 text-xs font-mono text-emerald-400 leading-relaxed shadow-inner">
              {JSON.stringify({ schema, userState: appData }, null, 2)}
            </pre>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="h-9 rounded-xl px-5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
