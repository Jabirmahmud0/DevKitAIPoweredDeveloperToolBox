import { NextRequest } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an expert technical writer and editor.
The user will provide Markdown content.
Improve the writing quality, clarity, and flow while maintaining the original meaning.
Format your response in Markdown.
Focus on:
1. Grammar and spelling corrections
2. Clearer sentence structure
3. Better word choices
4. Improved readability

Provide the improved version directly without explanations.`;

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const { action, content, context } = body;

        if (!content) {
            return new Response(JSON.stringify({ error: "Content is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        let prompt: string;
        let systemPrompt = SYSTEM_PROMPT;

        if (action === "improve") {
            prompt = `Improve this Markdown content:\n\n${content}`;
        } else if (action === "expand") {
            systemPrompt = `You are an expert technical writer.
The user will provide a heading or topic.
Generate a well-written Markdown section about that topic.
Use proper Markdown formatting including headers, lists, and code blocks where appropriate.`;
            prompt = context 
                ? `Write a section titled "${content}" that fits with this existing document:\n\n${context}`
                : `Write a section titled "${content}"`;
        } else {
            return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const stream = await generateStreamingText(prompt, systemPrompt);
        
        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "X-Vercel-AI-Data-Stream": "v1" },
        });

    } catch (error) {
        console.error("[Markdown AI Error]:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
