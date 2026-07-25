"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Workflow,
  BrainCircuit,
  Network,
  Milestone,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (elements: any[], isFallback: boolean, message?: string) => void;
}

const diagramPresets = [
  { id: "flowchart", label: "Flowchart", icon: Workflow, prompt: "Create a user registration & authentication flowchart with decision steps" },
  { id: "mindmap", label: "Mind Map", icon: BrainCircuit, prompt: "Brainstorming mind map for Product Growth and Q3 Strategy" },
  { id: "architecture", label: "System Architecture", icon: Network, prompt: "Microservices architecture with API Gateway, Auth, Postgres, and Redis" },
  { id: "user_journey", label: "User Journey", icon: Milestone, prompt: "E-commerce customer onboarding and checkout user journey" },
  { id: "process", label: "Process Diagram", icon: Layers, prompt: "Software engineering sprint lifecycle process diagram" },
];

export function AiDiagramModal({ isOpen, onClose, onGenerate }: AiDiagramModalProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState("flowchart");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: typeof diagramPresets[0]) => {
    setSelectedType(preset.id);
    if (!prompt.trim()) {
      setPrompt(preset.prompt);
    }
  };

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || diagramPresets.find(p => p.id === selectedType)?.prompt || "System Flowchart";
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/whiteboard/ai-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, diagramType: selectedType }),
      });

      const data = await res.json();

      if (data.elements && Array.isArray(data.elements)) {
        onGenerate(data.elements, data.fallback || false, data.message);
        onClose();
      } else {
        throw new Error(data.error || "Failed to generate diagram");
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setErrorMessage("Could not connect to AI service. Using local starter template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-base tracking-tight">AI Diagram Generator</h2>
              <p className="text-xs text-slate-500">Transform prompts into Excalidraw whiteboards</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Select Diagram Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {diagramPresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedType === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all text-center",
                      isSelected
                        ? "bg-violet-50 border-violet-500 text-violet-700 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("size-5", isSelected ? "text-violet-600" : "text-slate-400")} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Describe your Diagram
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A flowchart showing order fulfillment process from cart checkout to shipping..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Graceful Warning Notice if offline */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 text-xs font-medium rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="h-9 px-5 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-medium shadow-md shadow-violet-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Generating Diagram…</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Generate Diagram</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
