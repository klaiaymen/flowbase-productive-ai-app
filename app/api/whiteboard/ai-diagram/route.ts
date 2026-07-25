import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export interface HighLevelElement {
  id: string;
  type: "rectangle" | "diamond" | "ellipse" | "text" | "arrow";
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  strokeColor?: string;
  from?: string;
  to?: string;
  label?: string;
}

// Convert high-level node/edge definitions into Excalidraw compatible element objects
function convertToExcalidrawElements(items: HighLevelElement[]) {
  const elements: any[] = [];
  const nodeMap = new Map<string, { x: number; y: number; width: number; height: number }>();

  // First pass: generate shapes and text elements
  items.forEach((item, idx) => {
    if (item.type === "arrow") return;

    const elementId = item.id || `node_${idx}_${Date.now()}`;
    const x = item.x || 100 + (idx % 3) * 220;
    const y = item.y || 100 + Math.floor(idx / 3) * 160;
    const width = item.width || (item.type === "ellipse" ? 120 : item.type === "diamond" ? 140 : 160);
    const height = item.height || (item.type === "ellipse" ? 70 : item.type === "diamond" ? 90 : 80);
    const bgColor = item.backgroundColor || "#f8fafc";
    const strokeColor = item.strokeColor || "#334155";

    nodeMap.set(elementId, { x, y, width, height });

    // Excalidraw shape element
    const shapeType = item.type === "diamond" ? "diamond" : item.type === "ellipse" ? "ellipse" : "rectangle";
    const shapeElement = {
      id: elementId,
      type: shapeType,
      x,
      y,
      width,
      height,
      angle: 0,
      strokeColor,
      backgroundColor: bgColor,
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: item.text ? [{ id: `${elementId}_text`, type: "text" }] : [],
      updated: Date.now(),
      link: null,
      locked: false,
    };

    elements.push(shapeElement);

    if (item.text) {
      const textId = `${elementId}_text`;
      const fontSize = 16;
      const textWidth = Math.min(width - 16, item.text.length * 9);
      const textHeight = 24;
      const textX = x + (width - textWidth) / 2;
      const textY = y + (height - textHeight) / 2;

      const textElement = {
        id: textId,
        type: "text",
        x: textX,
        y: textY,
        width: textWidth,
        height: textHeight,
        angle: 0,
        strokeColor: strokeColor === "#f8fafc" ? "#0f172a" : strokeColor,
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 1000000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 1000000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        text: item.text,
        fontSize,
        fontFamily: 1,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: elementId,
        originalText: item.text,
        lineHeight: 1.25,
        baseline: 18,
      };

      elements.push(textElement);
    }
  });

  // Second pass: generate arrows
  items.filter((i) => i.type === "arrow").forEach((arrow, idx) => {
    const fromNode = nodeMap.get(arrow.from || "");
    const toNode = nodeMap.get(arrow.to || "");

    if (!fromNode || !toNode) return;

    const startX = fromNode.x + fromNode.width / 2;
    const startY = fromNode.y + fromNode.height;
    const endX = toNode.x + toNode.width / 2;
    const endY = toNode.y;

    const arrowId = arrow.id || `arrow_${idx}_${Date.now()}`;
    const dx = endX - startX;
    const dy = endY - startY;

    const arrowElement = {
      id: arrowId,
      type: "arrow",
      x: startX,
      y: startY,
      width: Math.abs(dx),
      height: Math.abs(dy),
      angle: 0,
      strokeColor: arrow.strokeColor || "#64748b",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 2 },
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: arrow.label ? [{ id: `${arrowId}_label`, type: "text" }] : [],
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [dx, dy],
      ],
      lastCommittedPoint: null,
      startBinding: { elementId: arrow.from, focus: 0, gap: 4 },
      endBinding: { elementId: arrow.to, focus: 0, gap: 4 },
      startArrowhead: null,
      endArrowhead: "arrow",
    };

    elements.push(arrowElement);
  });

  return elements;
}

// Starter Fallback Templates if Groq is unavailable
function getFallbackDiagram(type: string, prompt: string): HighLevelElement[] {
  switch (type) {
    case "mindmap":
      return [
        { id: "center", type: "ellipse", text: prompt.slice(0, 20) || "Central Idea", x: 300, y: 200, width: 160, height: 80, backgroundColor: "#e0e7ff", strokeColor: "#4338ca" },
        { id: "node1", type: "rectangle", text: "Branch 1: Core", x: 80, y: 100, width: 140, height: 60, backgroundColor: "#dcfce7", strokeColor: "#15803d" },
        { id: "node2", type: "rectangle", text: "Branch 2: Features", x: 520, y: 100, width: 140, height: 60, backgroundColor: "#fef9c3", strokeColor: "#a16207" },
        { id: "node3", type: "rectangle", text: "Branch 3: Future", x: 80, y: 300, width: 140, height: 60, backgroundColor: "#fce7f3", strokeColor: "#be185d" },
        { id: "node4", type: "rectangle", text: "Branch 4: Operations", x: 520, y: 300, width: 140, height: 60, backgroundColor: "#e0f2fe", strokeColor: "#0369a1" },
        { id: "a1", type: "arrow", from: "center", to: "node1" },
        { id: "a2", type: "arrow", from: "center", to: "node2" },
        { id: "a3", type: "arrow", from: "center", to: "node3" },
        { id: "a4", type: "arrow", from: "center", to: "node4" },
      ];

    case "architecture":
      return [
        { id: "client", type: "rectangle", text: "Web / Mobile Client", x: 250, y: 50, width: 180, height: 60, backgroundColor: "#e0f2fe", strokeColor: "#0284c7" },
        { id: "gateway", type: "rectangle", text: "API Gateway & Auth", x: 250, y: 160, width: 180, height: 60, backgroundColor: "#fae8ff", strokeColor: "#c026d3" },
        { id: "srv1", type: "rectangle", text: "User Service", x: 120, y: 280, width: 140, height: 60, backgroundColor: "#dcfce7", strokeColor: "#16a34a" },
        { id: "srv2", type: "rectangle", text: "Data Processor", x: 380, y: 280, width: 140, height: 60, backgroundColor: "#fef9c3", strokeColor: "#ca8a04" },
        { id: "db", type: "ellipse", text: "PostgreSQL Database", x: 250, y: 400, width: 180, height: 70, backgroundColor: "#ffedd5", strokeColor: "#c2410c" },
        { id: "a1", type: "arrow", from: "client", to: "gateway" },
        { id: "a2", type: "arrow", from: "gateway", to: "srv1" },
        { id: "a3", type: "arrow", from: "gateway", to: "srv2" },
        { id: "a4", type: "arrow", from: "srv1", to: "db" },
        { id: "a5", type: "arrow", from: "srv2", to: "db" },
      ];

    case "user_journey":
      return [
        { id: "step1", type: "rectangle", text: "1. Land on Homepage", x: 50, y: 150, width: 150, height: 70, backgroundColor: "#e0e7ff", strokeColor: "#4f46e5" },
        { id: "step2", type: "rectangle", text: "2. Explore Features", x: 240, y: 150, width: 150, height: 70, backgroundColor: "#e0f2fe", strokeColor: "#0284c7" },
        { id: "step3", type: "diamond", text: "Interested?", x: 430, y: 140, width: 140, height: 90, backgroundColor: "#fef9c3", strokeColor: "#ca8a04" },
        { id: "step4", type: "rectangle", text: "4. Sign Up / Onboard", x: 610, y: 150, width: 150, height: 70, backgroundColor: "#dcfce7", strokeColor: "#16a34a" },
        { id: "a1", type: "arrow", from: "step1", to: "step2" },
        { id: "a2", type: "arrow", from: "step2", to: "step3" },
        { id: "a3", type: "arrow", from: "step3", to: "step4" },
      ];

    case "process":
      return [
        { id: "p1", type: "rectangle", text: "Phase 1: Research & Discovery", x: 100, y: 80, width: 220, height: 60, backgroundColor: "#e0f2fe", strokeColor: "#0369a1" },
        { id: "p2", type: "rectangle", text: "Phase 2: Design & Prototype", x: 100, y: 180, width: 220, height: 60, backgroundColor: "#fce7f3", strokeColor: "#be185d" },
        { id: "p3", type: "rectangle", text: "Phase 3: Implementation", x: 100, y: 280, width: 220, height: 60, backgroundColor: "#dcfce7", strokeColor: "#15803d" },
        { id: "p4", type: "rectangle", text: "Phase 4: Launch & Review", x: 100, y: 380, width: 220, height: 60, backgroundColor: "#fef9c3", strokeColor: "#a16207" },
        { id: "a1", type: "arrow", from: "p1", to: "p2" },
        { id: "a2", type: "arrow", from: "p2", to: "p3" },
        { id: "a3", type: "arrow", from: "p3", to: "p4" },
      ];

    case "flowchart":
    default:
      return [
        { id: "start", type: "ellipse", text: "Start", x: 250, y: 50, width: 140, height: 60, backgroundColor: "#dcfce7", strokeColor: "#16a34a" },
        { id: "input", type: "rectangle", text: prompt.slice(0, 25) || "Process Input", x: 230, y: 150, width: 180, height: 60, backgroundColor: "#e0f2fe", strokeColor: "#0284c7" },
        { id: "decision", type: "diamond", text: "Validation Passed?", x: 230, y: 250, width: 180, height: 90, backgroundColor: "#fef9c3", strokeColor: "#ca8a04" },
        { id: "success", type: "rectangle", text: "Save & Complete", x: 100, y: 380, width: 160, height: 60, backgroundColor: "#d1fae5", strokeColor: "#047857" },
        { id: "error", type: "rectangle", text: "Log Error & Retry", x: 380, y: 380, width: 160, height: 60, backgroundColor: "#ffe4e6", strokeColor: "#e11d48" },
        { id: "end", type: "ellipse", text: "End", x: 250, y: 490, width: 140, height: 60, backgroundColor: "#e2e8f0", strokeColor: "#475569" },
        { id: "a1", type: "arrow", from: "start", to: "input" },
        { id: "a2", type: "arrow", from: "input", to: "decision" },
        { id: "a3", type: "arrow", from: "decision", to: "success" },
        { id: "a4", type: "arrow", from: "decision", to: "error" },
        { id: "a5", type: "arrow", from: "success", to: "end" },
      ];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, diagramType = "flowchart" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === "placeholder-key") {
      console.warn("GROQ_API_KEY is missing or invalid. Using fallback diagram generator.");
      const fallbackHighLevel = getFallbackDiagram(diagramType, prompt);
      const elements = convertToExcalidrawElements(fallbackHighLevel);
      return NextResponse.json({
        success: true,
        fallback: true,
        message: "AI API Key not configured. Standard starter diagram generated.",
        elements,
      });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `You are an expert software architect and UI diagram designer.
The user wants a diagram based on their request.
Generate a JSON array of diagram elements using the following JSON schema strictly:

{
  "elements": [
    {
      "id": "unique_string_id",
      "type": "rectangle" | "diamond" | "ellipse" | "arrow",
      "text": "short node text description",
      "x": number (x coordinate from 50 to 800),
      "y": number (y coordinate from 50 to 800),
      "width": number (optional, e.g. 150),
      "height": number (optional, e.g. 70),
      "backgroundColor": "#hexcolor",
      "strokeColor": "#hexcolor",
      "from": "source_node_id" (only for arrow type),
      "to": "target_node_id" (only for arrow type)
    }
  ]
}

Rules:
- For flowcharts, use "ellipse" for start/end, "rectangle" for steps, "diamond" for decisions.
- For mind maps, put a central node in center (e.g. x:400, y:250), and surrounding nodes connected via arrows.
- Use pleasing colors: light green (#dcfce7), light blue (#e0f2fe), light yellow (#fef9c3), light purple (#fae8ff), light pink (#fce7f3).
- Ensure nodes do not overlap and arrows properly link "from" and "to" IDs.
- Respond ONLY with valid JSON. No markdown code blocks, no trailing text.`;

    const userMessage = `Diagram Type: ${diagramType}\nUser Prompt: ${prompt}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseContent = completion.choices[0]?.message?.content || "";

    try {
      // Clean JSON if model included ```json wraps
      const cleanJson = responseContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      if (parsed.elements && Array.isArray(parsed.elements)) {
        const elements = convertToExcalidrawElements(parsed.elements);
        return NextResponse.json({
          success: true,
          fallback: false,
          elements,
        });
      }
    } catch (parseErr) {
      console.error("Failed to parse Groq response JSON:", parseErr);
    }

    // If Groq response parsing failed, use fallback
    const fallbackHighLevel = getFallbackDiagram(diagramType, prompt);
    const elements = convertToExcalidrawElements(fallbackHighLevel);
    return NextResponse.json({
      success: true,
      fallback: true,
      message: "AI response parsed with fallback template.",
      elements,
    });

  } catch (error: any) {
    console.error("Error in AI diagram API:", error);
    // Graceful error fallback
    const fallbackHighLevel = getFallbackDiagram("flowchart", "Generated Diagram");
    const elements = convertToExcalidrawElements(fallbackHighLevel);
    return NextResponse.json({
      success: true,
      fallback: true,
      message: "AI service temporarily unavailable. Generated starter template instead.",
      elements,
    });
  }
}
