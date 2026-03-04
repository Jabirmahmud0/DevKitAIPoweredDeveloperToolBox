import { NextRequest } from "next/server";
import { generateJson } from "@/lib/ai";
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
        const { codeSnippet, nodeJson } = body;

        if (!nodeJson) {
            return new Response(JSON.stringify({ error: "Node JSON is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const prompt = `Explain this AST node${codeSnippet ? ` from the following code:\n\n\`\`\`typescript\n${codeSnippet}\n\`\`\`` : ""}:\n\n${nodeJson}`;
        
        try {
            const explanation = await generateJson<{ explanation: string }>(prompt, SYSTEM_PROMPT);
            return new Response(JSON.stringify(explanation), { headers: { "Content-Type": "application/json" } });
        } catch (parseError) {
            return new Response(JSON.stringify({ error: "Failed to explain AST node" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

    } catch (error) {
        console.error("[AST AI Error]:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
