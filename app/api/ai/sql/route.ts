import { NextRequest } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an expert SQL developer.
The user will describe what data they want to retrieve.
Generate a valid SQL query that matches their request.

Assume a standard relational database schema.
Format your output as:
\`\`\`sql
<the_sql_query_here>
\`\`\`

Followed by a brief explanation of the query.`;

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

        const userPrompt = `Write a SQL query to: ${prompt}`;
        const stream = await generateStreamingText(userPrompt, SYSTEM_PROMPT);
        
        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "X-Vercel-AI-Data-Stream": "v1" },
        });

    } catch (error) {
        console.error("[SQL AI Error]:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
