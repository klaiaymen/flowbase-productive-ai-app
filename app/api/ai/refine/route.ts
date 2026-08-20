import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_SMALL_MODEL } from "@/lib/ai/groq-models";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  "improve-grammar":
    "You are a professional editor. Improve the grammar, spelling, and punctuation of the provided text. Keep the original meaning and style intact. Return only the improved text, no explanations.",
  rephrase:
    "You are a creative writing assistant. Rephrase the provided text in a fresh, natural way while preserving the original meaning. Return only the rephrased text, no explanations.",
  "make-shorter":
    "You are a concise writing expert. Shorten the provided text significantly while preserving all key information. Return only the shortened text, no explanations.",
  "make-longer":
    "You are an expansive writing assistant. Elaborate on the provided text with more detail, examples, and context while staying on topic. Return only the expanded text, no explanations.",
  "simplify-language":
    "You are a plain-language expert. Rewrite the provided text using simple, easy-to-understand language that anyone can read. Avoid jargon. Return only the simplified text, no explanations.",
  "change-tone":
    "You are a tone-shifting writing assistant. Rewrite the provided text in a professional, confident, and engaging tone. Return only the rewritten text, no explanations.",
};

export async function POST(req: NextRequest) {
  try {
    const { text, action } = await req.json();
    if (!text || !action) {
      return NextResponse.json({ error: "Missing text or action" }, { status: 400 });
    }
    const systemPrompt = SYSTEM_PROMPTS[action];
    if (!systemPrompt) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_SMALL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const result = completion.choices[0]?.message?.content ?? text;
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI Refine error:", error);
    return NextResponse.json({ error: "AI refine failed" }, { status: 500 });
  }
}
