import { NextRequest } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an expert Senior Software Engineer and Debugger.
The user has encountered an error or unexpected output while running their code.
They provide the source code, standard output, and standard error (if any).
Provide a clear, concise explanation of WHY the code is failing or behaving incorrectly, and suggest exactly HOW to fix it.
Format your response in Markdown, using code blocks to show the corrected portions of code.
Do not rewrite the entire file unless necessary. Point out the exact lines to change.`;

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const { code, language, error, stdout } = body;

        const prompt = `
## Context:
Language: ${language}

## Code:
\`\`\`${language}
${code}
\`\`\`

## Expected output wasn't met. Here are the logs:
STDOUT:
\`\`\`
${stdout || "(empty)"}
\`\`\`

STDERR / Compile Error:
\`\`\`
${error || "(empty)"}
\`\`\`

Please explain what went wrong and provide the fix.`;

        const stream = await generateStreamingText(prompt, SYSTEM_PROMPT);
        
        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "X-Vercel-AI-Data-Stream": "v1" },
        });

    } catch (error) {
        console.error("[AI Debug Error]:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
