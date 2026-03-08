import { NextRequest } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an expert Senior Software Engineer performing a code review.
Your job is to review the provided code snippet and offer actionable, constructive feedback.
Focus on:
1. Security vulnerabilities
2. Performance bottlenecks
3. Potential bugs and edge cases
4. Code readability and maintainability
5. Best practices for the specific language/framework

Format your output in clean Markdown.
If the code is already excellent, say so clearly, but still suggest one minor improvement if possible.
Do not provide a full rewrite of the code unless specifically requested or if the current code is fundamentally flawed.
Provide snippets of suggested fixes where applicable.

Keep your entire response concise and to the point.`;

export async function POST(req: NextRequest) {
    try {
        // Rate Limiting
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
            });
        }

        const body = await req.json();
        const { code, language } = body;

        if (!code) {
            return new Response(JSON.stringify({ error: "Code is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const prompt = `Please review the following ${language || "code"} snippet:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``;

        // Get the streaming response
        const aiStream = await generateStreamingText(prompt, SYSTEM_PROMPT);

        // Return with proper headers
        return new Response(aiStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Vercel-AI-Data-Stream": "v1",
            },
        });

    } catch (error) {
        console.error("[Code Review AI Error]:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
