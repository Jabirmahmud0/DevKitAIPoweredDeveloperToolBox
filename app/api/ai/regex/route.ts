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

IMPORTANT OUTPUT RULES:
1. Return ONLY the raw regex pattern - NO markdown, NO code blocks, NO backticks
2. Return JUST the pattern on a single line, nothing else
3. Escape all special regex characters in literal text: . ^ $ * + ? { } [ ] \\ | ( )
4. Keep the pattern as simple and readable as possible
5. After the pattern, add a VERY brief one-line explanation

Example correct output:
^match only this text$
Matches the exact text "match only this text" and nothing else.

Example correct output:
\\d{3}-\\d{4}
Matches phone number format: 3 digits, hyphen, 4 digits.

Example correct output:
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}
Matches standard email addresses.`;

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
        const { pattern, mode, description } = body;

        // Validate input based on mode
        if (mode === "explain" && !pattern) {
            return new Response(JSON.stringify({ error: "Pattern is required for explain mode" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        if (mode === "generate" && !description) {
            return new Response(JSON.stringify({ error: "Description is required for generate mode" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const isGenerate = mode === "generate";
        const systemPrompt = isGenerate ? GENERATE_SYSTEM_PROMPT : EXPLAIN_SYSTEM_PROMPT;
        const userPrompt = isGenerate
            ? `Write a regex to match: ${description}`
            : `Explain this regex:\n\n\`${pattern}\``;

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
