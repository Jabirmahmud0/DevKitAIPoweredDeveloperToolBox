import { NextRequest } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const EXPLAIN_SYSTEM_PROMPT = `You are a Regex Expert.
The user will provide a Regular Expression.
Explain what it does clearly, concisely, and step-by-step.
Format output in clean Markdown. Use code blocks for parts of the regex.
If the regex looks fundamentally broken or dangerous (e.g., catastrophic backtracking), point it out.
DO NOT provide the matching code in JS, just explain the pattern.`;

const GENERATE_SYSTEM_PROMPT = `You are a Regex Expert.
The user will describe what they want to match in plain English.
Generate the most accurate and safe Regular Expression for their request.
Format your output as:
\`\`\`regex
<the_regex_pattern_here>
\`\`\`
Followed by a very brief explanation of how it works.
Prioritize modern, readable regex, and avoid catastrophic backtracking risks.`;

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), { 
                status: 429,
                headers: { "Content-Type": "application/json" }
            });
        }

        const body = await req.json();
        const { type, content } = body;

        if (!content) {
            return new Response(JSON.stringify({ error: "Input content is required" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const isGenerate = type === "generate";
        const systemPrompt = isGenerate ? GENERATE_SYSTEM_PROMPT : EXPLAIN_SYSTEM_PROMPT;
        const userPrompt = isGenerate
            ? `Write a regex to match: ${content}`
            : `Explain this regex:\n\n\`${content}\``;

        const stream = await generateStreamingText(userPrompt, systemPrompt);
        
        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Vercel-AI-Data-Stream": "v1",
            },
        });

    } catch (error) {
        console.error("[Regex AI Error]:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: errorMessage }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
