import { NextRequest } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an expert UI/UX Designer and Color Theorist.
The user will describe a brand, emotion, or theme.
Generate a cohesive 5-color palette that perfectly matches their description.
Your response MUST be exclusively a JSON array of 5 hex codes.
DO NOT include markdown formatting, backticks, or explanations.
Example output: ["#1A1A1A", "#4A5568", "#A0AEC0", "#E2E8F0", "#F7FAFC"]`;

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const userPrompt = `Generate a 5-color palette for: ${prompt}`;
        const stream = await generateStreamingText(userPrompt, SYSTEM_PROMPT);
        return stream;

    } catch (error) {
        console.error("[Color AI Error]:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
