import type { Metadata } from "next";
import { AssistantClient } from "@/components/assistant/assistant-client";

export const metadata: Metadata = {
  title: "AI Assistant — Flowbase",
  description: "Chat with Flowbase AI to manage tasks, notes, calendar reminders, whiteboards, and more.",
};

export default function AssistantPage() {
  return <AssistantClient />;
}
