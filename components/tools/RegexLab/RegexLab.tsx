"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as Comlink from "comlink";
import { Wand2, BookOpen, Flag, AlertTriangle, RefreshCw, CheckCircle, Copy } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";
import type { RegexResult, MatchGroup } from "@/lib/workers/regex.worker";

interface MatchResult {
    fullMatch: string;
    start: number;
    end: number;
    index: number;
    groups: { name: string | null; value: string }[];
}

const FLAG_DESCRIPTIONS: Record<string, string> = {
    g: "Global — find all matches",
    i: "Case insensitive",
    m: "Multiline — ^ and $ match line breaks",
    s: "DotAll — . matches newlines",
    x: "Extended — allow whitespace comments",
};

const COMMON_PATTERNS = [
    { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
    { name: "URL", pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)" },
    { name: "IP Address", pattern: "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)" },
    { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])" },
    { name: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}" },
    { name: "Phone (US)", pattern: "(?:\\+?1[-.])?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}" },
    { name: "JWT Token", pattern: "eyJ[A-Za-z0-9_-]*\\.eyJ[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]+" },
    { name: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" },
];

function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHighlightedHtml(text: string, matches: MatchResult[]): string {
    if (!matches.length) return escapeHtml(text);
    const parts: string[] = [];
    let last = 0;
    const COLORS = ["#7c6af5", "#22d3a7", "#f59e0b", "#f43f5e", "#38bdf8", "#ec4899"];
    for (const match of matches) {
        if (match.start > last) parts.push(escapeHtml(text.slice(last, match.start)));
        const color = COLORS[match.index % COLORS.length];
        parts.push(`<mark style="background:${color}30;color:${color};border-radius:3px;padding:1px 2px;">${escapeHtml(match.fullMatch)}</mark>`);
        last = match.end;
    }
    if (last < text.length) parts.push(escapeHtml(text.slice(last)));
    return parts.join("");
}

export default function RegexLab() {
    const [pattern, setPattern] = useState("\\b\\w{4,}\\b");
    const [flags, setFlags] = useState<Set<string>>(new Set(["g", "i"]));
    const [testString, setTestString] = useState(
        "The quick brown fox jumps over the lazy dog.\nRegular expressions are powerful tools for text processing!"
    );
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [execTime, setExecTime] = useState<number | null>(null);
    const [aiMode, setAiMode] = useState<"explain" | "generate">("explain");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    
    const workerRef = useRef<Worker | null>(null);
    const regexApiRef = useRef<any>(null);

    // Initialize Web Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL("@/lib/workers/regex.worker.ts", import.meta.url));
        regexApiRef.current = Comlink.wrap(workerRef.current);
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Run regex using Web Worker
    const runRegex = useCallback(async () => {
        if (!pattern || !regexApiRef.current) { 
            setMatches([]); 
            setError(null); 
            return; 
        }
        try {
            const flagStr = [...flags].join("");
            const result: RegexResult = await regexApiRef.current.runRegex(pattern, flagStr, testString);
            
            if (result.error) {
                setError(result.error);
                setMatches([]);
                setExecTime(null);
            } else {
                const convertedMatches: MatchResult[] = result.matches.map((m: any) => ({
                    fullMatch: m.fullMatch,
                    start: m.start,
                    end: m.end,
                    index: m.index,
                    groups: m.groups.map((g: any) => ({ name: g.name, value: g.value })),
                }));
                setMatches(convertedMatches);
                setError(null);
                setExecTime(result.executionTime);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setMatches([]);
            setExecTime(null);
        }
    }, [pattern, flags, testString]);

    useEffect(() => {
        runRegex();
    }, [runRegex]);

    function toggleFlag(f: string) {
        setFlags((prev) => {
            const s = new Set(prev);
            s.has(f) ? s.delete(f) : s.add(f);
            return s;
        });
    }

    const handleAI = useCallback(async () => {
        setIsAiLoading(true);
        setAiResponse("");
        setError(null);
        
        try {
            const response = await fetch("/api/ai/regex", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pattern: aiMode === "explain" ? pattern : undefined,
                    mode: aiMode,
                    description: aiMode === "generate" ? aiPrompt : undefined,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: "Request failed" }));
                throw new Error(errData.error || `HTTP ${response.status}`);
            }

            // Read streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            
            if (!reader) throw new Error("No response body");

            let accumulatedText = "";
            let buffer = "";
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;
                    
                    if (trimmedLine.startsWith("0:")) {
                        try {
                            const data = JSON.parse(trimmedLine.slice(2));
                            if (data.textDelta) {
                                accumulatedText += data.textDelta;
                                setAiResponse(accumulatedText);
                            }
                        } catch {
                            if (trimmedLine.length > 2) {
                                accumulatedText += trimmedLine.slice(2);
                                setAiResponse(accumulatedText);
                            }
                        }
                    }
                }
            }
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Unknown error";
            setError(errMsg);
            console.error("[Regex AI Error]:", err);
        } finally {
            setIsAiLoading(false);
        }
    }, [aiMode, pattern, aiPrompt]);

    const handleCopyResponse = useCallback(() => {
        if (!aiResponse) return;
        navigator.clipboard.writeText(aiResponse);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }, [aiResponse]);

    const handleCopyPatternOnly = useCallback(() => {
        if (!aiResponse) return;
        // Extract first line (the regex pattern)
        const firstLine = aiResponse.split('\n')[0].trim();
        navigator.clipboard.writeText(firstLine);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }, [aiResponse]);

    const highlightedHtml = buildHighlightedHtml(testString, matches);

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* LEFT PANEL */}
            <div className="flex flex-col flex-1 min-h-0 border-r border-[var(--border)]">
                {/* Pattern input */}
                <div className="p-4 border-b border-[var(--border)] space-y-3 bg-[var(--bg-surface)]">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1.5 block font-medium">Regular Expression</label>
                        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-[var(--accent)] transition-colors">
                            <span className="text-[var(--text-muted)] font-mono text-lg">/</span>
                            <input
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                className="flex-1 bg-transparent font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                                placeholder="your pattern here"
                                spellCheck={false}
                            />
                            <span className="text-[var(--text-muted)] font-mono text-lg">/{[...flags].join("")}</span>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-[var(--danger)]">
                                <AlertTriangle size={12} /> {error}
                            </div>
                        )}
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(FLAG_DESCRIPTIONS).map(([flag, desc]) => (
                            <button
                                key={flag}
                                onClick={() => toggleFlag(flag)}
                                title={desc}
                                className="px-2.5 py-1 rounded-lg font-mono text-xs transition-all"
                                style={{
                                    background: flags.has(flag) ? "var(--accent-glow)" : "var(--bg-elevated)",
                                    color: flags.has(flag) ? "var(--accent)" : "var(--text-muted)",
                                    border: `1px solid ${flags.has(flag) ? "var(--accent)" : "var(--border)"}`,
                                }}
                            >
                                {flag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Test String */}
                <div className="flex-1 flex flex-col min-h-0 p-4 gap-3 overflow-hidden">
                    <div className="flex-1 min-h-0 flex flex-col">
                        <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Test String</label>
                        <textarea
                            value={testString}
                            onChange={(e) => setTestString(e.target.value)}
                            className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 font-mono text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors resize-none overflow-auto"
                        />
                    </div>

                    {/* Highlighted Preview */}
                    <div className="flex-shrink-0">
                        <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Match Preview</label>
                        <div
                            className="w-full max-h-[120px] min-h-[60px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 font-mono text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words overflow-auto"
                            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span>{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
                        {execTime !== null && <span>{execTime.toFixed(2)}ms</span>}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col bg-[var(--bg-surface)]">
                {/* Common Patterns */}
                <div className="p-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={13} className="text-[var(--accent)]" />
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Common Patterns</span>
                    </div>
                    <div className="space-y-1">
                        {COMMON_PATTERNS.map((p) => (
                            <button
                                key={p.name}
                                onClick={() => setPattern(p.pattern)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-left group"
                            >
                                <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{p.name}</span>
                                <code className="text-[9px] text-[var(--text-muted)] font-mono truncate max-w-[120px] ml-2">{p.pattern.slice(0, 24)}…</code>
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI Panel */}
                <div className="flex-1 p-3 flex flex-col gap-3 min-h-0">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Wand2 size={13} className="text-[var(--accent)]" />
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">AI Assistant</span>
                    </div>
                    <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1 flex-shrink-0">
                        {(["explain", "generate"] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setAiMode(mode)}
                                className="flex-1 py-1.5 text-xs rounded-md transition-all capitalize"
                                style={{
                                    background: aiMode === mode ? "var(--accent)" : "transparent",
                                    color: aiMode === mode ? "white" : "var(--text-muted)",
                                }}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    {aiMode === "generate" && (
                        <input
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe what to match..."
                            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors flex-shrink-0"
                        />
                    )}
                    <button
                        onClick={handleAI}
                        disabled={isAiLoading || (aiMode === "generate" && !aiPrompt)}
                        className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40 flex-shrink-0"
                        style={{ background: "var(--accent)", color: "white" }}
                    >
                        {isAiLoading ? <RefreshCw size={12} className="animate-spin" /> : <Wand2 size={12} />}
                        {aiMode === "explain" ? "Explain Pattern" : "Generate Regex"}
                    </button>
                    
                    {/* AI Response Display */}
                    {(aiResponse || isAiLoading) && (
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="flex items-center justify-between mb-1 flex-shrink-0">
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                                    {isAiLoading ? "Generating..." : "Response"}
                                </span>
                                {aiResponse && !isAiLoading && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleCopyPatternOnly}
                                            className="p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-1 text-[10px] text-[var(--accent)]"
                                            title="Copy pattern only (first line)"
                                        >
                                            <Copy size={10} /> Pattern
                                        </button>
                                        <button
                                            onClick={handleCopyResponse}
                                            className="p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors"
                                            title="Copy full response"
                                        >
                                            {copySuccess ? <CheckCircle size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-mono bg-[var(--bg-elevated)] rounded-xl p-3">
                                {aiResponse}
                                {isAiLoading && <span className="animate-blink text-[var(--accent)]">▌</span>}
                            </div>
                        </div>
                    )}
                    
                    {!aiResponse && !isAiLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-xs text-center gap-2 p-4">
                            <Wand2 size={24} className="opacity-30" />
                            <span>Click "Explain Pattern" or "Generate Regex" to get AI help</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
