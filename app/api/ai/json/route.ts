import { NextRequest } from "next/server";
import { generateJson } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an expert TypeScript developer.
Given a JSON object, generate both:
1. A TypeScript interface that strictly types the JSON
2. A Zod schema for runtime validation

Format your response as:
\`\`\`typescript
interface MyInterface { ... }
\`\`\`

\`\`\`typescript
const schema = z.object({ ... });
\`\`\`

Keep it concise and accurate.`;

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response("Too many requests. Please try again later.", { status: 429 });
        }

        const body = await req.json();
        const { json } = body;

        if (!json) {
            return new Response("JSON is required", { status: 400 });
        }

        try {
            const parsed = JSON.parse(json);
            const prompt = `Generate TypeScript interface and Zod schema for this JSON:\n\n${JSON.stringify(parsed, null, 2)}`;
            
            const code = await generateJson<{ code: string }>(prompt, SYSTEM_PROMPT);
            return new Response(JSON.stringify(code), {
                headers: { "Content-Type": "application/json" }
            });
        } catch (parseError) {
            return new Response("Invalid JSON input", { status: 400 });
        }

    } catch (error) {
        console.error("[JSON AI Error]:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
