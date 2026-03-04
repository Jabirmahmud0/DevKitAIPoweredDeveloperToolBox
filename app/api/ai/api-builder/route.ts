import { NextRequest } from "next/server";
import { generateJson } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an API design expert.
The user will describe an HTTP request they want to make.
Generate the request configuration as JSON with:
- method: HTTP method (GET, POST, PUT, PATCH, DELETE)
- url: The full URL
- headers: Array of { key, value } objects
- params: Array of { key, value } objects (query parameters)
- body: Request body object (if applicable)

Respond with ONLY valid JSON, no markdown or explanations.`;

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

        const userPrompt = `Create an HTTP request configuration for: ${prompt}`;
        
        try {
            const config = await generateJson(userPrompt, SYSTEM_PROMPT);
            return new Response(JSON.stringify(config), { headers: { "Content-Type": "application/json" } });
        } catch (parseError) {
            return new Response(JSON.stringify({ error: "Failed to generate request config" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

    } catch (error) {
        console.error("[API Builder AI Error]:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
