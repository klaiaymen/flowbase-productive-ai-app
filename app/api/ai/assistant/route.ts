import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { GROQ_LARGE_MODEL } from "@/lib/ai/groq-models";

export const maxDuration = 45;

const SYSTEM_PROMPT = `You are Flowbase AI — the intelligent command center for the Flowbase productivity app. You help users manage their workspace through natural conversation. You are warm, concise, and action-oriented.

## Your Capabilities

You can perform the following ACTIONS on behalf of the user:

1. **create_task** — Create a Kanban task in a specific board
   - Required fields: title (string), boardId (number), priority ("low" | "medium" | "high")
   - Optional fields: description, dueDate (YYYY-MM-DD format)
   - If the user has multiple boards and doesn't specify which one → ALWAYS ask which board they want before creating.

2. **create_board** — Create a new Kanban board
   - Required fields: name (string), color (one of: "amber", "violet", "emerald", "sky", "rose", "cyan", "indigo", "fuchsia")

3. **add_calendar_item** — Add an event/reminder/task to the calendar
   - Required fields: title (string), type ("task" | "reminder"), category ("work" | "learning" | "urgent" | "ideas" | "personal")
   - Optional fields: date (YYYY-MM-DD), time (HH:MM in 24h format), description
   - If date is unclear, compute from context (e.g., "tomorrow" → tomorrow's date) or ask for it.

4. **create_note** — Create a new note
   - Required fields: title (string)
   - Optional fields: content (plain text or HTML)

5. **create_whiteboard** — Create a new whiteboard
   - Required fields: name (string)
   - Optional fields: color ("emerald" | "violet" | "sky" | "amber" | "rose" | "indigo")

6. **generate_template** — Generate an AI Template Builder app
   - Required fields: prompt (string) — the theme/idea for the mini app

7. **navigate** — Navigate the user to a page in the app
   - Required fields: href (one of: "/", "/kanban", "/calendar", "/notes", "/whiteboard", "/templates", "/spaces", "/admin")
   - Use this when user says "go to", "open", "show me" etc.

## Response Format

You MUST respond with a valid JSON object in one of these two formats:

### Format A — Conversational reply (no action, or asking for clarification):
\`\`\`json
{
  "reply": "Your friendly message here",
  "action": null
}
\`\`\`

### Format B — Action to perform:
\`\`\`json
{
  "reply": "Confirmation message shown to user after action",
  "action": "action_type",
  "payload": { ...action-specific fields }
}
\`\`\`

## Critical Rules

- ALWAYS return valid JSON. Never return plain text.
- ALWAYS ask for missing required information before taking action. One follow-up question at a time.
- For create_task: if the user has multiple boards AND hasn't specified which board → respond with Format A asking them to choose. The context will include their boards list.
- Keep replies short, warm, and action-focused. Never be verbose.
- When confirming an action, use Format B. The reply should be a success message like "✅ Task 'Buy groceries' created in your Work board!"
- If you cannot do something, say so clearly and suggest what you CAN help with.
- Today's date for computing relative dates: {{TODAY_DATE}}

## Available Boards Context
{{BOARDS_CONTEXT}}

## User Workspace Summary
{{WORKSPACE_CONTEXT}}
`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, boardsContext, workspaceContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Fallback response without AI
      return NextResponse.json({
        reply: "I'm having trouble connecting to the AI service right now. Please check the GROQ_API_KEY configuration.",
        action: null,
      });
    }

    const todayDate = new Date().toISOString().split("T")[0];
    const systemPrompt = SYSTEM_PROMPT
      .replace("{{TODAY_DATE}}", todayDate)
      .replace("{{BOARDS_CONTEXT}}", boardsContext || "No boards available.")
      .replace("{{WORKSPACE_CONTEXT}}", workspaceContext || "No workspace data available.");

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: GROQ_LARGE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.4,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const rawText = completion.choices[0]?.message?.content?.trim() || "{}";

    let parsed: { reply: string; action: string | null; payload?: Record<string, unknown> };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { reply: rawText, action: null };
    }

    if (!parsed.reply) {
      parsed.reply = "I'm not sure how to respond to that. Could you rephrase?";
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI Assistant route error:", error);
    return NextResponse.json(
      {
        reply: "Something went wrong on my end. Please try again in a moment.",
        action: null,
      },
      { status: 500 }
    );
  }
}
