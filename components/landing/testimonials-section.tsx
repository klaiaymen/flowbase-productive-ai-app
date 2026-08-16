"use client";

import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Alex Rivera",
    role: "Founder & CEO at LaunchScale",
    avatar: "AR",
    color: "bg-cyan-500",
    rating: 5,
    text: "Flowbase replaced Notion and Miro for our startup. The Groq AI assistant creates tasks on our Kanban board automatically, saving our engineering team hours every week.",
  },
  {
    name: "Elena Rostova",
    role: "Lead Product Manager at CloudFlow",
    avatar: "ER",
    color: "bg-violet-500",
    rating: 5,
    text: "The Liveblocks real-time multiplayer is incredible. We run sprint planning on shared whiteboards while keeping live comments attached to our product requirement docs.",
  },
  {
    name: "Marcus Vance",
    role: "Head of Operations at Apex Labs",
    avatar: "MV",
    color: "bg-emerald-500",
    rating: 5,
    text: "The AI Template Builder is pure magic. We prompted a habit & budget tracker app and it instantly generated the full layout schema. Flowbase is our central operating system.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 relative bg-slate-900/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            Loved by Builders
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            What Creators & Leaders Say
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            See how Flowbase accelerates team productivity and spatial organization.
          </p>
        </div>

        {/* 3 Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-[2rem] border border-white/90 bg-white/90 p-6 shadow-sm backdrop-blur-xl space-y-4 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="size-6 text-slate-200" />
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed italic">"{t.text}"</p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className={`size-10 rounded-full ${t.color} text-white font-black text-xs grid place-items-center shadow-xs`}>
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-950">{t.name}</h4>
                  <p className="text-[11px] font-medium text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
