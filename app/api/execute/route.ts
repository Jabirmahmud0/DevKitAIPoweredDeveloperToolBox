import { NextRequest } from "next/server";
import { aiLimiter } from "@/lib/ratelimit";

// Use public Judge0 API by default or custom if provided
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await aiLimiter.limit(ip);

        if (!success) {
            return new Response("Too many requests. Please try again.", { status: 429 });
        }

        const body = await req.json();
        const { language_id, source_code, stdin } = body;

        if (!source_code || !language_id) {
            return new Response("Missing source_code or language_id", { status: 400 });
        }

        if (!RAPIDAPI_KEY && JUDGE0_API_URL.includes("rapidapi.com")) {
            return new Response("RapidAPI Key is missing for Judge0 CE", { status: 500 });
        }

        // 1. Submit Code
        const submissionRes = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(JUDGE0_API_URL.includes("rapidapi.com") && {
                     "X-RapidAPI-Host": RAPIDAPI_HOST,
                     "X-RapidAPI-Key": RAPIDAPI_KEY
                })
            },
            body: JSON.stringify({
                source_code,
                language_id,
                stdin: stdin || "",
            })
        });

        if (!submissionRes.ok) {
            const errBody = await submissionRes.text();
            console.error("Judge0 Error:", errBody);
            return new Response(`Code execution failed. Status: ${submissionRes.status}`, { status: 502 });
        }

        const result = await submissionRes.json();
        return new Response(JSON.stringify(result), {
             headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("[Code Execution Error]:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
