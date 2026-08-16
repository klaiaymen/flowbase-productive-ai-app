"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Free Plan",
    price: "$0",
    period: "forever",
    description: "Perfect for personal note-taking, task tracking, and exploring AI workspace features.",
    features: [
      "Notion-style notes editor",
      "Up to 3 Kanban boards",
      "Smart calendar scheduling",
      "1 Excalidraw whiteboard",
      "Basic Groq AI Assistant queries",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    highlighted: false,
    badge: "Personal",
  },
  {
    name: "Pro Plan",
    price: "$12",
    period: "per user / month",
    description: "For professionals and creators who need unlimited boards, AI template generation, and voice input.",
    features: [
      "Everything in Free",
      "Unlimited Kanban boards & notes",
      "Unlimited Excalidraw whiteboards",
      "Groq AI Assistant & Task execution",
      "AssemblyAI real-time voice input",
      "AI Template Builder mini apps",
      "Automated productivity insights",
      "Priority customer support",
    ],
    cta: "Start Pro Free Trial",
    href: "/sign-up",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Team Plan",
    price: "$29",
    period: "per user / month",
    description: "For startups, agile teams, and organizations requiring real-time multiplayer collaboration and admin control.",
    features: [
      "Everything in Pro",
      "Liveblocks real-time multiplayer",
      "Active user presence cursors",
      "Shared Kanban board permissions",
      "Page & task comments threads",
      "Superuser & PMO RBAC admin roles",
      "Team space management",
      "99.9% Uptime SLA & dedicated support",
    ],
    cta: "Start Team Trial",
    href: "/sign-up",
    highlighted: false,
    badge: "Enterprise Ready",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
            Simple Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Choose the Perfect Plan for Your Flow
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            No credit card required to start. Upgrade anytime as your workspace scales.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[2.5rem] border p-8 flex flex-col justify-between transition-all duration-300 relative ${
                plan.highlighted
                  ? "border-cyan-300 bg-gradient-to-b from-white via-cyan-50/50 to-violet-50/50 shadow-2xl shadow-cyan-200/50 md:-translate-y-2"
                  : "border-white/90 bg-white/90 shadow-sm hover:shadow-md backdrop-blur-xl"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-1 text-xs font-extrabold shadow-md flex items-center gap-1">
                  <Sparkles className="size-3" />
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-950">{plan.name}</h3>
                  {!plan.highlighted && (
                    <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-slate-950">{plan.price}</span>
                  <span className="text-xs font-semibold text-slate-500">{plan.period}</span>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">{plan.description}</p>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Included Features</p>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link href={plan.href}>
                  <Button
                    className={`w-full h-11 rounded-xl font-bold text-xs shadow-md ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white hover:from-cyan-600 hover:via-violet-600 hover:to-fuchsia-600 shadow-cyan-200/80"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
