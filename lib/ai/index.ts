import { GoogleGenAI } from "@google/genai";

// API Keys for rotation
const API_KEYS = [
    process.env.GOOGLE_API_KEY_1 || "",
    process.env.GOOGLE_API_KEY_2 || "",
    process.env.GOOGLE_API_KEY_3 || "",
    process.env.GOOGLE_API_KEY_4 || "",
    process.env.GOOGLE_API_KEY_5 || "",
    process.env.GOOGLE_API_KEY_6 || "",
].filter(key => key.length > 0);

// Track key usage and errors for rotation
let currentKeyIndex = 0;
const keyErrorCounts = new Map<number, number>();
const keyLastRetryTime = new Map<number, number>();
const MAX_ERRORS_PER_KEY = 3;
const KEY_COOLDOWN_MS = 30000; // 30 seconds cooldown after errors

/**
 * Get the next available API key with smart rotation
 * Rotates to next key if current key has too many errors or is on cooldown
 */
function getNextApiKey(): string {
    if (API_KEYS.length === 0) {
        throw new Error("No Google API keys configured. Please set GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc. in .env.local");
    }

    // If only one key, return it
    if (API_KEYS.length === 1) {
        return API_KEYS[0];
    }

    const startTime = Date.now();
    let attempts = 0;
    
    // Find a key that's not on cooldown and hasn't exceeded error limit
    while (attempts < API_KEYS.length) {
        const errors = keyErrorCounts.get(currentKeyIndex) || 0;
        const lastRetry = keyLastRetryTime.get(currentKeyIndex) || 0;
        
        // Check if this key is usable
        if (errors < MAX_ERRORS_PER_KEY && (startTime - lastRetry > KEY_COOLDOWN_MS)) {
            const keyIndex = currentKeyIndex;
            // Move to next key for next request (round-robin)
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            return API_KEYS[keyIndex];
        }
        
        // This key is not usable, try next one
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        attempts++;
    }
    
    // All keys are on cooldown or exceeded errors, use current anyway
    const keyIndex = currentKeyIndex;
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return API_KEYS[keyIndex];
}

/**
 * Record an error for the current key
 */
function recordKeyError(keyIndex: number, error: unknown): void {
    const errors = keyErrorCounts.get(keyIndex) || 0;
    keyErrorCounts.set(keyIndex, errors + 1);
    keyLastRetryTime.set(keyIndex, Date.now());
    console.error(`[Google AI] Error with key ${keyIndex + 1}/${API_KEYS.length}:`, 
        error instanceof Error ? error.message : String(error));
}

/**
 * Reset error count for a key (call after successful request)
 */
function resetKeyError(keyIndex: number): void {
    keyErrorCounts.set(keyIndex, 0);
    keyLastRetryTime.delete(keyIndex);
}

/**
 * Check if error is a rate limit (429)
 */
function isRateLimitError(error: unknown): boolean {
    if (error instanceof Error && 'status' in error) {
        return (error as any).status === 429 || (error as any).code === 429;
    }
    return false;
}

/**
 * Check if error is a not found (404) - don't retry these
 */
function isNotFoundError(error: unknown): boolean {
    if (error instanceof Error && 'status' in error) {
        return (error as any).status === 404 || (error as any).code === 404;
    }
    return false;
}

/**
 * Delay helper for exponential backoff
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a GoogleGenAI client with the next available API key
 */
function createGoogleClient(): { client: GoogleGenAI; keyIndex: number } {
    const apiKey = getNextApiKey();
    const keyIndex = currentKeyIndex > 0 ? currentKeyIndex - 1 : API_KEYS.length - 1;
    const client = new GoogleGenAI({ apiKey });
    return { client, keyIndex };
}

/**
 * Generate streaming text response using Google Gemini with exponential backoff
 * Returns a ReadableStream for the Vercel AI SDK compatibility
 */
export async function generateStreamingText(
    prompt: string,
    system?: string,
    model: string = "gemini-2.5-flash",
    maxRetries: number = 3
): Promise<ReadableStream> {
    const { client, keyIndex } = createGoogleClient();

    const fullPrompt = system
        ? `${system}\n\n${prompt}`
        : prompt;

    // Exponential backoff retry loop
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await client.models.generateContentStream({
                model: model,
                contents: fullPrompt,
            });

            // Create a text streaming response compatible with Vercel AI SDK
            const encoder = new TextEncoder();
            return new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of response) {
                            // Extract text from candidates safely
                            let text = '';
                            if (chunk.candidates && chunk.candidates.length > 0) {
                                const candidate = chunk.candidates[0];
                                if (candidate.content?.parts) {
                                    for (const part of candidate.content.parts) {
                                        if (part.text) {
                                            text += part.text;
                                        }
                                    }
                                }
                            }

                            if (text) {
                                // Use AI SDK v4 protocol format - plain text string
                                controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
                            }
                        }
                        // Send finish signal
                        controller.close();
                        resetKeyError(keyIndex);
                    } catch (error) {
                        recordKeyError(keyIndex, error);
                        controller.error(error);
                    }
                },
            });
        } catch (error) {
            // Don't retry on 404 errors (invalid model, etc.)
            if (isNotFoundError(error)) {
                console.error(`[Google AI] 404 Error (not retrying):`,
                    error instanceof Error ? error.message : String(error));
                throw error;
            }

            // Rate limit or other error - apply backoff
            recordKeyError(keyIndex, error);

            if (attempt < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s...
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`[Google AI] Retry ${attempt + 1}/${maxRetries} in ${waitTime}ms...`);
                await delay(waitTime);

                // Try with next key
                const nextClient = createGoogleClient();
                return generateStreamingTextWithClient(nextClient, fullPrompt, maxRetries, attempt + 1);
            }
        }
    }

    throw new Error("Max retries reached for Google AI request");
}

/**
 * Internal helper for retrying with a different client
 */
async function generateStreamingTextWithClient(
    clientInfo: { client: GoogleGenAI; keyIndex: number },
    fullPrompt: string,
    maxRetries: number,
    currentAttempt: number
): Promise<ReadableStream> {
    const { client, keyIndex } = clientInfo;
    
    try {
        const response = await client.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        const encoder = new TextEncoder();
        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        // Extract text from candidates safely
                        let text = '';
                        if (chunk.candidates && chunk.candidates.length > 0) {
                            const candidate = chunk.candidates[0];
                            if (candidate.content?.parts) {
                                for (const part of candidate.content.parts) {
                                    if (part.text) {
                                        text += part.text;
                                    }
                                }
                            }
                        }
                        
                        if (text) {
                            // Use AI SDK v4 protocol format - plain text string
                            controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
                        }
                    }
                    controller.close();
                    resetKeyError(keyIndex);
                } catch (error) {
                    recordKeyError(keyIndex, error);
                    controller.error(error);
                }
            },
        });
    } catch (error) {
        if (isNotFoundError(error)) {
            throw error;
        }
        
        recordKeyError(keyIndex, error);
        
        if (currentAttempt < maxRetries - 1) {
            const waitTime = Math.pow(2, currentAttempt) * 1000;
            console.log(`[Google AI] Retry ${currentAttempt + 1}/${maxRetries} in ${waitTime}ms...`);
            await delay(waitTime);
            
            const nextClient = createGoogleClient();
            return generateStreamingTextWithClient(nextClient, fullPrompt, maxRetries, currentAttempt + 1);
        }
        
        throw new Error("Max retries reached for Google AI request");
    }
}

/**
 * Generate non-streaming text response using Google Gemini with backoff
 */
export async function generateText(
    prompt: string,
    system?: string,
    model: string = "gemini-2.5-flash",
    maxRetries: number = 3
): Promise<string> {
    const { client, keyIndex } = createGoogleClient();
    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await client.models.generateContent({
                model: model,
                contents: fullPrompt,
            });

            resetKeyError(keyIndex);
            return response.text || "";
        } catch (error) {
            if (isNotFoundError(error)) {
                throw error;
            }
            
            recordKeyError(keyIndex, error);
            
            if (attempt < maxRetries - 1) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`[Google AI] Retry ${attempt + 1}/${maxRetries} in ${waitTime}ms...`);
                await delay(waitTime);
            }
        }
    }
    
    throw new Error("Max retries reached for Google AI request");
}

/**
 * Generate structured JSON response using Google Gemini
 */
export async function generateJson<T>(
    prompt: string,
    system?: string,
    model: string = "gemini-2.5-flash",
    maxRetries: number = 3
): Promise<T> {
    const jsonSystem = `${system}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no explanations.`;
    const text = await generateText(prompt, jsonSystem, model, maxRetries);
    
    // Clean up response (remove markdown if present)
    const cleanText = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
    
    try {
        return JSON.parse(cleanText) as T;
    } catch (error) {
        console.error("[Google AI] Failed to parse JSON:", error, "Raw text:", text);
        throw new Error(`Failed to parse JSON response: ${error}`);
    }
}

/**
 * Create a Next.js Response with streaming AI text
 */
export async function createStreamingResponse(
    prompt: string,
    system?: string,
    model?: string
): Promise<Response> {
    const stream = await generateStreamingText(prompt, system, model);
    return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}

// Export for use in components
export type AIModel = "gemini" | "gemini-2.5-flash" | "gemini-2.0-flash" | "gemini-2.0-flash-lite";

/**
 * Map user-friendly model names to actual API model names
 */
export function resolveModelName(model: AIModel): string {
    const modelMap: Record<AIModel, string> = {
        "gemini": "gemini-2.5-flash",
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-2.0-flash": "gemini-2.0-flash",
        "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
    };
    return modelMap[model] || "gemini-2.5-flash";
}
