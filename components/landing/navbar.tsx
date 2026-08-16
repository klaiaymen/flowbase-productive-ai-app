"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, ArrowRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export function Navbar() {
  const { isSignedIn, user } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Showcase", href: "#showcase" },
    { label: "AI Tools", href: "#ai-features" },
    { label: "Collaboration", href: "#collaboration" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-xs py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-fuchsia-500 text-white shadow-lg shadow-cyan-200/70 group-hover:scale-105 transition-transform">
            <Sparkles className="size-4" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-950">Flowbase</span>
            <span className="ml-1.5 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-200/60">
              AI Workspace
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-4 py-1.5 backdrop-blur-md shadow-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/">
              <Button className="h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-xs shadow-md shadow-cyan-200/60 hover:from-cyan-600 hover:to-violet-600">
                <LayoutDashboard className="mr-1.5 size-3.5" />
                Go to Workspace
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" className="h-9 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="h-9 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/10 hover:bg-slate-800">
                  Get Started Free
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isSignedIn ? (
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-xs">
                  <LayoutDashboard className="mr-1.5 size-4" />
                  Go to Workspace
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-bold text-slate-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-10 rounded-xl bg-slate-900 text-white font-bold text-xs">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
