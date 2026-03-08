import { NextRequest, NextResponse } from "next/server";
import { generateStreamingText, resolveModelName } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an expert UI/UX Designer and Color Theorist.
The user will describe a brand, emotion, or theme.
Generate a cohesive 5-color palette that perfectly matches their description.
Your response MUST be exclusively a JSON array of 5 hex codes.
DO NOT include markdown formatting, backticks, or explanations.
Example output: ["#1A1A1A", "#4A5568", "#A0AEC0", "#E2E8F0", "#F7FAFC"]`;

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json();
        const { prompt, model } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const userPrompt = `Generate a 5-color palette for: ${prompt}`;
        const selectedModel = resolveModelName(model || "gemini");
        const stream = await generateStreamingText(userPrompt, SYSTEM_PROMPT, selectedModel);

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Vercel-AI-Data-Stream": "v1",
            },
        });

    } catch (error) {
        console.error("[Color AI Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
