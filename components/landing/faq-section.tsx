"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "How does the AI Assistant work across the app?",
    answer: "The AI Assistant is powered by Groq Llama 3.3. It acts as a central command center that can execute actions directly in your workspace — such as creating tasks in specific Kanban boards, scheduling calendar reminders, refining note text, and generating AI app templates via chat or voice.",
  },
  {
    question: "How does real-time collaboration work?",
    answer: "Real-time collaboration is powered by Liveblocks WebSocket engine. Team members get active presence cursors, shared Kanban board access, and live comment threads on living docs and task cards.",
  },
  {
    question: "What features are included in the Notion-style Notes editor?",
    answer: "Flowbase Notes uses Tiptap rich text supporting slash commands (`/`), task checklists, blockquotes, code blocks, color-coded note pins, and instant AI text refiners (rephrase, summarize, expand, simplify).",
  },
  {
    question: "Can I sketch and draw diagrams on the Whiteboard?",
    answer: "Yes! Flowbase embeds an infinite spatial canvas powered by Excalidraw. You can draw architecture flowcharts, mind maps, sticky notes, and wireframe diagrams directly alongside your notes.",
  },
  {
    question: "What is the AI Template Builder?",
    answer: "The AI Template Builder allows you to prompt the AI with any idea (e.g. 'Personal Budget Tracker' or 'Study Exam Planner'). The AI generates a full single-page application schema complete with interactive stats grids, progress bars, checklists, and data tables.",
  },
  {
    question: "Is my workspace data secure and private?",
    answer: "Yes. All user data is isolated per account using Clerk authentication and Neon PostgreSQL database encryption. We do not use your private workspace data to train public AI models.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
            <HelpCircle className="size-3.5" />
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            Everything you need to know about Flowbase features, AI capabilities, and data security.
          </p>
        </div>

        {/* Expandable Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-white/90 bg-white/90 overflow-hidden shadow-xs backdrop-blur-xl transition-all"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-950 hover:bg-slate-50/60 transition-colors"
                >
                  <span>{faq.question}</span>
                  <div className={`flex size-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-transform ${isOpen ? "rotate-180 bg-cyan-100 text-cyan-700" : ""}`}>
                    <ChevronDown className="size-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100/80 bg-slate-50/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
