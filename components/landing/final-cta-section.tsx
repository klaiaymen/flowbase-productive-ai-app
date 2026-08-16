"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTASection() {
  return (
    <section className="py-20 relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[3rem] border border-white/90 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-10 md:p-16 text-white shadow-2xl overflow-hidden text-center space-y-8">
          {/* Background glowing orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-cyan-300 border border-white/15 backdrop-blur-md">
              <Sparkles className="size-3.5" />
              Transform Your Productivity
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Build your entire productivity system in one AI workspace
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Join thousands of founders, students, creators, and agile teams organizing their deep work momentum with Flowbase.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/sign-up">
              <Button className="h-13 px-8 rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-white font-black text-sm shadow-xl shadow-cyan-500/30 hover:scale-105 transition-transform">
                <Sparkles className="mr-2 size-4" />
                Start for Free Now
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Instant 60-second setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Free tier included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
