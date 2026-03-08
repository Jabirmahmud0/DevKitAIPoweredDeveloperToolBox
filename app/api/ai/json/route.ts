import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";
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
import { z } from 'zod';
const schema = z.object({ ... });
\`\`\`

Keep it concise and accurate. Only output the code blocks, nothing else.`;

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json();
        const { json } = body;

        if (!json) {
            return NextResponse.json({ error: "JSON is required" }, { status: 400 });
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch (parseError) {
            return NextResponse.json({
                error: "Invalid JSON input",
                details: parseError instanceof Error ? parseError.message : String(parseError)
            }, { status: 400 });
        }

        try {
            const prompt = `Generate TypeScript interface and Zod schema for this JSON:\n\n${JSON.stringify(parsed, null, 2)}`;

            const code = await generateText(prompt, SYSTEM_PROMPT);

            return NextResponse.json({ code });
        } catch (aiError) {
            console.error("[JSON AI Error]:", aiError);
            return NextResponse.json({
                error: "Failed to generate schema",
                details: aiError instanceof Error ? aiError.message : String(aiError)
            }, { status: 500 });
        }

    } catch (error) {
        console.error("[JSON API Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
