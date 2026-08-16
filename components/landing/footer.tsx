"use client";

import Link from "next/link";
import { Sparkles, Github, Twitter, Linkedin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-xl py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-fuchsia-500 text-white shadow-md">
                <Sparkles className="size-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-950">Flowbase</span>
            </Link>
            <p className="text-xs text-slate-600 font-medium max-w-sm leading-relaxed">
              The AI-powered workspace combining Notion docs, Miro whiteboards, Kanban project boards, smart calendar scheduling, and Groq AI intelligence into one cozy platform.
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-1">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                <Github className="size-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-500 transition-colors">
                <Twitter className="size-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                <Linkedin className="size-4" />
              </a>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Product</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li><a href="#features" className="hover:text-slate-950 transition-colors">Features Overview</a></li>
              <li><Link href="/kanban" className="hover:text-slate-950 transition-colors">Kanban Boards</Link></li>
              <li><Link href="/notes" className="hover:text-slate-950 transition-colors">Notion Notes</Link></li>
              <li><Link href="/whiteboard" className="hover:text-slate-950 transition-colors">Excalidraw Canvas</Link></li>
              <li><Link href="/calendar" className="hover:text-slate-950 transition-colors">Smart Calendar</Link></li>
              <li><Link href="/templates" className="hover:text-slate-950 transition-colors">AI Template Builder</Link></li>
            </ul>
          </div>

          {/* Column 2: Resources & Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Solutions</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li><a href="#use-cases" className="hover:text-slate-950 transition-colors">For Founders</a></li>
              <li><a href="#use-cases" className="hover:text-slate-950 transition-colors">For Engineering Teams</a></li>
              <li><a href="#use-cases" className="hover:text-slate-950 transition-colors">For Students</a></li>
              <li><a href="#use-cases" className="hover:text-slate-950 transition-colors">For Creators</a></li>
              <li><a href="#collaboration" className="hover:text-slate-950 transition-colors">Liveblocks Multiplayer</a></li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Legal & Security</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li><a href="#faq" className="hover:text-slate-950 transition-colors">Privacy Policy</a></li>
              <li><a href="#faq" className="hover:text-slate-950 transition-colors">Terms of Service</a></li>
              <li><a href="#faq" className="hover:text-slate-950 transition-colors">Data Security</a></li>
              <li><a href="#faq" className="hover:text-slate-950 transition-colors">Cookie Settings</a></li>
              <li><a href="#faq" className="hover:text-slate-950 transition-colors">System Status</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <p>© {new Date().getFullYear()} Flowbase Productivity Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="size-3 text-rose-500 fill-rose-500" /> for modern creators and teams.
          </p>
        </div>
      </div>
    </footer>
  );
}
