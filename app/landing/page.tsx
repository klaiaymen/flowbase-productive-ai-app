import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Flowbase — The AI-Powered Workspace for Notes, Tasks & Collaboration",
  description: "Unify Notion living docs, Miro whiteboards, Kanban project boards, smart calendar scheduling, and Groq AI intelligence into one modern workspace.",
};

export default function LandingRoute() {
  return <LandingPage />;
}
