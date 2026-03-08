import { NextRequest } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an AST explanation expert.
The user will provide a JavaScript/TypeScript code snippet and a specific AST node.
Explain what that node does in clear, simple terms.

Focus on:
1. What the node represents (function, variable, expression, etc.)
2. Its role in the code
3. How it relates to surrounding code

Keep explanations concise and educational.`;

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const { codeSnippet, nodeJson, model } = body;

        if (!nodeJson) {
            return new Response(JSON.stringify({ error: "Node JSON is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const prompt = `Explain this AST node${codeSnippet ? ` from the following code:\n\n\`\`\`typescript\n${codeSnippet}\n\`\`\`` : ""}:\n\n${nodeJson}`;

        // Map model names to actual Gemini model names
        const modelMap: Record<string, string> = {
            "gemini": "gemini-2.5-flash",
            "gemini-2.5-flash": "gemini-2.5-flash",
        };
        const selectedModel = modelMap[model || "gemini"] || "gemini-2.5-flash";

        // Get the streaming response
        const aiStream = await generateStreamingText(prompt, SYSTEM_PROMPT, selectedModel);

        return new Response(aiStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Vercel-AI-Data-Stream": "v1",
            },
        });

    } catch (error) {
        console.error("[AST AI Error]:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
