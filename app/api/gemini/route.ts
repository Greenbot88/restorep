import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Standard lazy initialization & fail-safe as required by guidelines
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in server environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { datasetSummary, analyticsType } = body;

    const ai = getAiClient();

    const systemPrompt = `You are the Expert Restaurant Consultant and Operations Auditor for "Rameshwaram Cafe", a famous busy South Indian eatery. 
Your goal is to analyze the active shift production, sales, and wastage metrics, and output highly practical, actionable suggestions for Mahesh (the Restaurant Manager) to improve margins.
Keep your tone warm, professional, encouraging, and highly specific to South Indian kitchen operations (e.g. batter fermentation times, cold storage prep, dynamic shift planning, chutney shelf life, high temperature grinding variables). 
Address "Mahesh" directly. Use styled HTML paragraphs, strong elements, list items, and metric highlights. Clean, elegant, readable layout is paramount.`;

    const userPrompt = `
Analyze the following active dataset for the restaurant branch "Indiranagar" for Date "27-04-2026":
Analytics Focus Mode: ${analyticsType || "General Operations & Wastage Audit"}

Active Dataset:
${JSON.stringify(datasetSummary, null, 2)}

Provide a structured, beautifully written report with:
1. **Critical Alert / Flagship High Wastage Item**: (Identify which item code/name has the most wasted cost/weight, why it might have happened, e.g. overproduction in Shift 2).
2. **Operations Recommendation**: (Kitchen-specific advice like batter control, chutney cooling, grinding limits, or shift volume adjustment).
3. **Menu/Sales Drive Suggestion**: (Suggest a promotion or quick pricing bundle to clear remaining batter surplus in Shift 2).
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: systemPrompt },
        { text: userPrompt }
      ],
      config: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    });

    const recommendationText = response.text || "Unable to formulate a recommendation. Please double check logs.";
    return NextResponse.json({ text: recommendationText });
  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to load expert AI recommendation.", 
        details: error.message || error 
      },
      { status: 500 }
    );
  }
}
