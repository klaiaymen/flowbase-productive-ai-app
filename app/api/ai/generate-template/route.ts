import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_LARGE_MODEL } from "@/lib/ai/groq-models";

export const maxDuration = 30; // 30s timeout

// Fallback template generators when Groq API key is missing or encounters errors
function generateFallbackApp(prompt: string) {
  const p = prompt.toLowerCase();

  if (p.includes("budget") || p.includes("finance") || p.includes("expense") || p.includes("money")) {
    return {
      appName: "Personal Budget Tracker",
      description: "Track monthly expenses, income goals, and spending limits.",
      icon: "Wallet",
      color: "#10B981", // Emerald
      layout: "single-page",
      sections: [
        {
          id: "stats",
          type: "stats-grid",
          title: "Financial Overview",
          items: [
            { id: "s1", label: "Monthly Income", value: "$4,500", change: "+$200", icon: "TrendingUp" },
            { id: "s2", label: "Total Spent", value: "$1,850", change: "41% of budget", icon: "CreditCard" },
            { id: "s3", label: "Remaining Budget", value: "$2,650", change: "Safe zone", icon: "PiggyBank" },
          ],
        },
        {
          id: "progress",
          type: "progress-bar",
          title: "Monthly Spending Cap",
          label: "Spent $1,850 of $4,500 budget",
          percentage: 41,
        },
        {
          id: "checklist",
          type: "checklist",
          title: "Monthly Financial Goals",
          items: [
            { id: "g1", label: "Save $500 into Emergency Fund", completed: true, category: "Savings" },
            { id: "g2", label: "Pay Utility Bills before 15th", completed: true, category: "Bills" },
            { id: "g3", label: "Review Subscriptions & Cancel Unused", completed: false, category: "Audit" },
            { id: "g4", label: "Invest $300 in Index Funds", completed: false, category: "Investments" },
          ],
        },
        {
          id: "table",
          type: "data-table",
          title: "Recent Transactions Log",
          columns: ["Category", "Merchant / Title", "Amount", "Date"],
          rows: [
            { id: "t1", Category: "Groceries", "Merchant / Title": "Whole Foods Market", Amount: "$124.50", Date: "Today" },
            { id: "t2", Category: "Utilities", "Merchant / Title": "Electric & Power Co", Amount: "$85.00", Date: "Yesterday" },
            { id: "t3", Category: "Subscriptions", "Merchant / Title": "Productivity Suite", Amount: "$14.99", Date: "3 days ago" },
          ],
        },
      ],
      sampleData: {},
    };
  }

  if (p.includes("meal") || p.includes("diet") || p.includes("nutrition") || p.includes("food")) {
    return {
      appName: "Smart Meal & Nutrition Planner",
      description: "Plan daily meals, balance macros, and track hydration.",
      icon: "Utensils",
      color: "#F59E0B", // Amber
      layout: "single-page",
      sections: [
        {
          id: "stats",
          type: "stats-grid",
          title: "Nutrition Daily Stats",
          items: [
            { id: "m1", label: "Daily Calories", value: "1,850 kcal", change: "Target: 2,200", icon: "Flame" },
            { id: "m2", label: "Protein Intakes", value: "120g", change: "Target: 140g", icon: "Activity" },
            { id: "m3", label: "Water Drank", value: "2.4 Liters", change: "80% of target", icon: "Droplets" },
          ],
        },
        {
          id: "progress",
          type: "progress-bar",
          title: "Daily Calorie Target",
          label: "1,850 / 2,200 kcal consumed",
          percentage: 84,
        },
        {
          id: "checklist",
          type: "checklist",
          title: "Daily Healthy Habits",
          items: [
            { id: "h1", label: "Eat 3 servings of fresh vegetables", completed: true, category: "Vitamins" },
            { id: "h2", label: "Drink glass of warm lemon water at morning", completed: true, category: "Hydration" },
            { id: "h3", label: "Prepare healthy meal prep for tomorrow", completed: false, category: "Prep" },
          ],
        },
        {
          id: "table",
          type: "data-table",
          title: "Today's Meal Log",
          columns: ["Meal", "Food Items", "Calories", "Protein"],
          rows: [
            { id: "r1", Meal: "Breakfast", "Food Items": "Oatmeal, Banana, Almond Butter", Calories: "420 kcal", Protein: "18g" },
            { id: "r2", Meal: "Lunch", "Food Items": "Grilled Chicken Salad, Quinoa", Calories: "580 kcal", Protein: "45g" },
            { id: "r3", Meal: "Snack", "Food Items": "Greek Yogurt & Berries", Calories: "210 kcal", Protein: "20g" },
          ],
        },
      ],
      sampleData: {},
    };
  }

  if (p.includes("study") || p.includes("exam") || p.includes("course") || p.includes("learn")) {
    return {
      appName: "Study & Course Planner",
      description: "Organize subjects, track revision streaks, and manage exam prep.",
      icon: "GraduationCap",
      color: "#6366F1", // Indigo
      layout: "single-page",
      sections: [
        {
          id: "stats",
          type: "stats-grid",
          title: "Study Performance",
          items: [
            { id: "st1", label: "Hours Studied", value: "14.5 hrs", change: "This week", icon: "Clock" },
            { id: "st2", label: "Study Streak", value: "6 Days", change: "Personal best", icon: "Flame" },
            { id: "st3", label: "Topics Completed", value: "18 / 25", change: "72% progress", icon: "CheckCircle" },
          ],
        },
        {
          id: "progress",
          type: "progress-bar",
          title: "Exam Readiness Score",
          label: "18 of 25 core modules reviewed",
          percentage: 72,
        },
        {
          id: "checklist",
          type: "checklist",
          title: "Today's Revision Schedule",
          items: [
            { id: "c1", label: "Read Chapter 4: Data Structures & Algorithms", completed: true, category: "Computer Science" },
            { id: "c2", label: "Complete 15 practice problem sets", completed: true, category: "Practice" },
            { id: "c3", label: "Review Flashcards for vocabulary", completed: false, category: "Memory" },
            { id: "c4", label: "Watch lecture recording on Module 5", completed: false, category: "Lectures" },
          ],
        },
        {
          id: "table",
          type: "data-table",
          title: "Upcoming Assignments & Exams",
          columns: ["Subject", "Task / Topic", "Due Date", "Priority"],
          rows: [
            { id: "a1", Subject: "Computer Science", "Task / Topic": "Algorithm Analysis Quiz", "Due Date": "Friday", Priority: "High" },
            { id: "a2", Subject: "Mathematics", "Task / Topic": "Linear Algebra Problem Set", "Due Date": "Next Monday", Priority: "Medium" },
            { id: "a3", Subject: "Physics", "Task / Topic": "Lab Report Submission", "Due Date": "Next Wednesday", Priority: "High" },
          ],
        },
      ],
      sampleData: {},
    };
  }

  // Generic Habit / Productivity Tracker fallback
  const capitalizedTitle = prompt.charAt(0).toUpperCase() + prompt.slice(1);
  return {
    appName: `${capitalizedTitle} Dashboard`,
    description: `Track metrics, daily progress, and tasks for ${prompt}.`,
    icon: "Flame",
    color: "#8B5CF6", // Violet
    layout: "single-page",
    sections: [
      {
        id: "stats",
        type: "stats-grid",
        title: "Key Indicators",
        items: [
          { id: "i1", label: "Current Streak", value: "7 Days", change: "+1 today", icon: "Flame" },
          { id: "i2", label: "Completion Rate", value: "88%", change: "+4% vs last week", icon: "CheckCircle" },
          { id: "i3", label: "Active Goals", value: "5 Active", change: "On track", icon: "Target" },
        ],
      },
      {
        id: "progress",
        type: "progress-bar",
        title: "Overall Goal Completion",
        label: "88% of target achieved",
        percentage: 88,
      },
      {
        id: "checklist",
        type: "checklist",
        title: "Daily Action Plan",
        items: [
          { id: "k1", label: `Complete core morning routine for ${prompt}`, completed: true, category: "Core" },
          { id: "k2", label: `Log progress metrics and observations`, completed: true, category: "Tracking" },
          { id: "k3", label: `Review weekly milestones and next steps`, completed: false, category: "Planning" },
        ],
      },
      {
        id: "table",
        type: "data-table",
        title: "Activity Log",
        columns: ["Activity", "Category", "Time Spent", "Status"],
        rows: [
          { id: "r1", Activity: "Morning Session", Category: "Core Work", "Time Spent": "45 mins", Status: "Completed" },
          { id: "r2", Activity: "Midday Review", Category: "Analysis", "Time Spent": "20 mins", Status: "Completed" },
        ],
      },
    ],
    sampleData: {},
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.warn("GROQ_API_KEY missing. Using fallback AI template generator.");
      const fallbackApp = generateFallbackApp(prompt.trim());
      return NextResponse.json({ result: fallbackApp });
    }

    try {
      const groq = new Groq({ apiKey });

      const systemPrompt = `You are an expert UI/UX system designer creating JSON layouts for single-page productivity apps.
Given a user app idea prompt, you MUST return a single JSON object containing:
- "appName": A catchy, concise title (2-4 words)
- "description": Short 1-sentence explanation of what the app does
- "icon": A Lucide icon name from this list: ["Flame", "Wallet", "Utensils", "GraduationCap", "CheckSquare", "Activity", "Target", "Calendar", "Sparkles", "Dumbbell", "BookOpen", "Clock", "Heart", "Compass"]
- "color": A vibrant HEX color code (e.g. "#F97316", "#10B981", "#6366F1", "#EC4899", "#8B5CF6", "#3B82F6")
- "layout": "single-page"
- "sections": An array of UI block objects. Include AT LEAST:
  1. A "stats-grid" section with 3 key metric cards: { "id": "stats", "type": "stats-grid", "title": "Overview", "items": [{ "id": "s1", "label": "...", "value": "...", "change": "...", "icon": "..." }] }
  2. A "progress-bar" section: { "id": "prog", "type": "progress-bar", "title": "Goal Progress", "label": "...", "percentage": 75 }
  3. A "checklist" section with 3-4 checkable items: { "id": "list", "type": "checklist", "title": "Action Items", "items": [{ "id": "c1", "label": "...", "completed": false, "category": "..." }] }
  4. A "data-table" section with 3 columns & 3 rows: { "id": "table", "type": "data-table", "title": "Log & Records", "columns": ["Col1", "Col2", "Col3"], "rows": [{ "id": "r1", "Col1": "...", "Col2": "...", "Col3": "..." }] }

IMPORTANT: Return ONLY raw valid JSON. No markdown codeblocks (\`\`\`json), no preamble text.`;

      const completion = await groq.chat.completions.create({
        model: GROQ_LARGE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a single-page app layout JSON for: "${prompt.trim()}"` },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const rawText = completion.choices[0]?.message?.content?.trim() || "";
      const parsed = JSON.parse(rawText);

      if (!parsed.appName || !parsed.sections) {
        throw new Error("Invalid structure returned by AI");
      }

      return NextResponse.json({ result: parsed });
    } catch (groqErr) {
      console.error("Groq API error or parse failure. Falling back to local template generator:", groqErr);
      const fallbackApp = generateFallbackApp(prompt.trim());
      return NextResponse.json({ result: fallbackApp });
    }
  } catch (error: any) {
    console.error("Generate Template error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate template." }, { status: 500 });
  }
}
