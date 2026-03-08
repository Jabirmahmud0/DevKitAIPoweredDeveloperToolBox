import { NextRequest, NextResponse } from "next/server";
import { generateStreamingText } from "@/lib/ai";
import { aiLimiter } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are an API design expert.
The user will describe an HTTP request they want to make.
Generate the request configuration as JSON with:
- method: HTTP method (GET, POST, PUT, PATCH, DELETE)
- url: The full URL - use https://jsonplaceholder.typicode.com for demo/test APIs
- headers: Array of { key, value } objects
- params: Array of { key, value } objects (query parameters)
- body: Request body object (if applicable)

Respond with ONLY valid JSON, no markdown or explanations.`;

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const userPrompt = `Create an HTTP request configuration for: ${prompt}`;
        const stream = await generateStreamingText(userPrompt, SYSTEM_PROMPT);
        return new NextResponse(stream);

    } catch (error) {
        console.error("[API Builder AI Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
