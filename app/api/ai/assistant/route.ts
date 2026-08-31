import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { GROQ_LARGE_MODEL } from "@/lib/ai/groq-models";
import {
  db,
  spaces,
  pages,
  kanbanBoards,
  kanbanColumns,
  kanbanTasks,
  notes,
  whiteboards,
  aiTemplates,
} from "@/db";
import { eq, inArray, desc, and } from "drizzle-orm";

export const maxDuration = 45;

async function getUserDatabaseSummary(clerkUserId: string) {
  try {
    // 1. Fetch Spaces
    const userSpaces = await db
      .select({
        id: spaces.id,
        name: spaces.name,
        description: spaces.description,
        color: spaces.color,
        createdAt: spaces.createdAt,
      })
      .from(spaces)
      .where(eq(spaces.clerkUserId, clerkUserId))
      .orderBy(desc(spaces.updatedAt));

    const spaceIds = userSpaces.map((s) => s.id);

    // 2. Fetch Pages for those spaces
    let userPages: any[] = [];
    if (spaceIds.length > 0) {
      userPages = await db
        .select({
          id: pages.id,
          spaceId: pages.spaceId,
          name: pages.name,
          description: pages.description,
          template: pages.template,
          createdAt: pages.createdAt,
        })
        .from(pages)
        .where(and(inArray(pages.spaceId, spaceIds), eq(pages.isArchived, false)))
        .orderBy(desc(pages.updatedAt));
    }

    // 3. Fetch Kanban Boards & Tasks
    const userBoards = await db
      .select({
        id: kanbanBoards.id,
        name: kanbanBoards.name,
        color: kanbanBoards.color,
        description: kanbanBoards.description,
      })
      .from(kanbanBoards)
      .orderBy(desc(kanbanBoards.createdAt));

    const boardIds = userBoards.map((b) => b.id);
    let recentTasks: string[] = [];

    if (boardIds.length > 0) {
      const cols = await db
        .select({ id: kanbanColumns.id })
        .from(kanbanColumns)
        .where(inArray(kanbanColumns.boardId, boardIds));

      const colIds = cols.map((c) => c.id);
      if (colIds.length > 0) {
        const tasks = await db
          .select({ title: kanbanTasks.title, priority: kanbanTasks.priority })
          .from(kanbanTasks)
          .where(inArray(kanbanTasks.columnId, colIds))
          .limit(10);
        recentTasks = tasks.map((t) => `"${t.title}" (${t.priority})`);
      }
    }

    // 4. Fetch Notes
    const userNotes = await db
      .select({ id: notes.id, title: notes.title })
      .from(notes)
      .where(and(eq(notes.clerkUserId, clerkUserId), eq(notes.isTrashed, false)))
      .limit(10);

    // 5. Fetch Whiteboards
    const userWhiteboards = await db
      .select({ id: whiteboards.id, name: whiteboards.name })
      .from(whiteboards)
      .where(eq(whiteboards.clerkUserId, clerkUserId))
      .limit(10);

    const spacesSummary =
      userSpaces.length > 0
        ? userSpaces
            .map((s) => {
              const pList = userPages
                .filter((p) => p.spaceId === s.id)
                .map((p) => `"${p.name}"`);
              return `- Espace/Projet [ID: ${s.id}]: "${s.name}" (Description: "${
                s.description || "Aucune"
              }", Pages associées: ${pList.length > 0 ? pList.join(", ") : "Aucune"})`;
            })
            .join("\n")
        : "Aucun espace ou projet créé pour le moment.";

    const pagesSummary =
      userPages.length > 0
        ? userPages
            .map(
              (p) =>
                `- Page [ID: ${p.id}, Espace ID: ${p.spaceId}]: "${p.name}" (Template: ${p.template})`
            )
            .join("\n")
        : "Aucune page de documentation.";

    const boardsSummary =
      userBoards.length > 0
        ? userBoards.map((b) => `- Tableau Kanban [ID: ${b.id}]: "${b.name}"`).join("\n")
        : "Aucun tableau Kanban.";

    return `
=== DONNÉES RÉELLES EN TEMPS RÉEL (BASE DE DONNÉES POSTGRESQL) ===
📌 ESPACES DE TRAVAIL & PROJETS (${userSpaces.length}) :
${spacesSummary}

📄 PAGES DE DOCUMENTATION (${userPages.length}) :
${pagesSummary}

📊 TABLEAUX KANBAN (${userBoards.length}) :
${boardsSummary}
(Tâches récentes: ${recentTasks.length > 0 ? recentTasks.join(", ") : "Aucune tâche"})

📝 NOTES PERSONNELLES : ${
      userNotes.length > 0 ? userNotes.map((n) => `"${n.title}"`).join(", ") : "Aucune note"
    }
🎨 TABLEAUX BLANCS : ${
      userWhiteboards.length > 0
        ? userWhiteboards.map((w) => `"${w.name}"`).join(", ")
        : "Aucun tableau blanc"
    }
`;
  } catch (err) {
    console.error("Error fetching user database summary for AI:", err);
    return "Informations de la base de données non disponibles actuellement.";
  }
}

const SYSTEM_PROMPT = `You are Flowbase AI — the intelligent, autonomous command center for the Flowbase productivity app. You answer fluently in French or English according to the user's language.

## Your Core Powers:

1. **Real-time Database Queries & Direct Answers**:
   - You have REAL-TIME ACCESS to the user's database records in \`{{USER_DATABASE_CONTEXT}}\`.
   - When the user asks for their projects, spaces, tasks, pages, or general status (e.g., "donnez moi la liste de mes projets", "quelles sont mes pages", "show my projects"), read \`{{USER_DATABASE_CONTEXT}}\` and provide a clear, friendly, well-formatted Markdown summary with IDs, names, descriptions, and page counts.

2. **Autonomous Project Planning & Execution**:
   - When the user asks for a complete work plan or methodology for a new project (e.g. "donnez moi un plan de travail complet pour un projet de gestion de stock"), you MUST:
     a) Detail a complete step-by-step methodology and action plan in French in the \`reply\` text.
     b) Trigger the **\`create_full_project\`** action to AUTOMATICALLY create the project resources in Flowbase (Space, Documentation Page with full plan, Kanban Board, and key initial tasks).

3. **Supported Actions**:

- **create_full_project** — Autonomous creation of a complete project space + plan page + kanban board + initial tasks.
  Payload format:
  \`\`\`json
  {
    "spaceName": "Gestion de Stock",
    "spaceDescription": "Espace de gestion d'inventaire, de suivi de stock et d'approvisionnement",
    "spaceColor": "emerald",
    "pageName": "Plan de Travail & Procédures Stock",
    "pageContent": "<h1>📦 Plan de Travail - Gestion de Stock</h1><hr/><h2>1. Inventaire Initial</h2><p>Description...</p>",
    "boardName": "Tableau de Stock & Commandes",
    "boardColor": "emerald",
    "tasks": [
      { "title": "Inventaire initial des produits", "priority": "high" },
      { "title": "Configuration des seuils de réapprovisionnement", "priority": "high" },
      { "title": "Mise en place de la procédure de réception", "priority": "medium" }
    ]
  }
  \`\`\`

- **create_space** — Create a workspace (payload: { "name": string, "description"?: string, "color"?: string })
- **create_page** — Create a page (payload: { "spaceName"?: string, "spaceId"?: number, "name": string, "description"?: string, "content"?: string })
- **create_task** — Create a Kanban task (payload: { "title": string, "boardId": number, "priority": "low" | "medium" | "high", "description"?: string })
- **create_board** — Create a Kanban board (payload: { "name": string, "color": string })
- **add_calendar_item** — Add calendar item (payload: { "title": string, "type": "task"|"reminder", "category": string, "date"?: string })
- **create_note** — Create a note (payload: { "title": string, "content"?: string })
- **create_whiteboard** — Create a whiteboard (payload: { "name": string, "color"?: string })
- **generate_template** — Generate an AI app template (payload: { "prompt": string })
- **navigate** — Navigate to route (payload: { "href": string })

## Response Format:

You MUST respond with a valid JSON object in one of two formats:

Format A — Conversational reply (no action):
\`\`\`json
{
  "reply": "Votre réponse claire et amicale en Markdown",
  "action": null
}
\`\`\`

Format B — Action to perform:
\`\`\`json
{
  "reply": "Explication et confirmation de l'action créée...",
  "action": "create_full_project",
  "payload": { ... }
}
\`\`\`

## Critical Rules:
- ALWAYS return valid JSON. Never plain text.
- Match the user's language (respond in French if prompt is in French).
- Today's date for reference: {{TODAY_DATE}}

## Real-Time Database Context:
{{USER_DATABASE_CONTEXT}}
`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "Le service IA n'est pas configuré (GROQ_API_KEY manquante).",
        action: null,
      });
    }

    // Load real user database context
    const dbSummary = await getUserDatabaseSummary(userId);

    const todayDate = new Date().toISOString().split("T")[0];
    const systemPrompt = SYSTEM_PROMPT.replace("{{TODAY_DATE}}", todayDate).replace(
      "{{USER_DATABASE_CONTEXT}}",
      dbSummary
    );

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
      temperature: 0.3,
      max_tokens: 1200,
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
      parsed.reply = "Je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ?";
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI Assistant route error:", error);
    return NextResponse.json(
      {
        reply: "Désolé, une erreur s'est produite lors de la communication avec l'assistant IA.",
        action: null,
      },
      { status: 500 }
    );
  }
}

