"use client";

import { Navbar } from "./navbar";
import { HeroSection } from "./hero-section";
import { FeatureSection } from "./feature-section";
import { HowItWorksSection } from "./how-it-works-section";
import { ProductShowcase } from "./product-showcase";
import { AiFeaturesSection } from "./ai-features-section";
import { CollaborationSection } from "./collaboration-section";
import { UseCasesSection } from "./use-cases-section";
import { PricingSection } from "./pricing-section";
import { TestimonialsSection } from "./testimonials-section";
import { FAQSection } from "./faq-section";
import { FinalCTASection } from "./final-cta-section";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#bdfbea_0,#effcff_22%,#fff7d6_47%,#f1eaff_72%,#fff7fb_100%)] text-foreground selection:bg-cyan-200 selection:text-cyan-900 overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <FeatureSection />
        <HowItWorksSection />
        <ProductShowcase />
        <AiFeaturesSection />
        <CollaborationSection />
        <UseCasesSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
