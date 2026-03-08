"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Play, Copy, Download, AlertTriangle, CheckCircle, Info, Zap, RefreshCw } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";
import { TOOL_MAP } from "@/lib/tools";
import { addHistoryEntry } from "@/lib/db";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div className="skeleton w-full h-full rounded-lg" />,
});

const LANGUAGE_OPTIONS = [
    "javascript", "typescript", "python", "go", "rust", "java", "cpp",
    "csharp", "php", "ruby", "swift", "kotlin", "sql", "html", "css",
    "json", "yaml", "markdown", "bash", "dockerfile",
];

export default function CodeReviewer() {
    const { fontSize, editorTheme, activeToolId, globalModel } = useToolStore();
    const tool = TOOL_MAP[activeToolId];
    const [code, setCode] = useState(`// Paste your code here for AI review
function processUserData(users) {
  let result = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].age > 18) {
      result.push(users[i].name);
    }
  }
  return result;
}`);
    const [language, setLanguage] = useState("javascript");
    const [review, setReview] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleReview = useCallback(async () => {
        if (!code.trim()) return;
        
        setIsLoading(true);
        setReview("");
        setError(null);
        
        abortControllerRef.current = new AbortController();
        
        try {
            const response = await fetch("/api/ai/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language, model: globalModel }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: "Request failed" }));
                throw new Error(errData.error || errData.message || `HTTP ${response.status}`);
            }

            // Read streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No response body");

            let accumulatedText = "";
            let buffer = "";

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Process complete lines
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || ""; // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) continue;

                        // Vercel AI SDK format: "0:{...}" or "0:\"...\"" or "d:{...}"
                        if (trimmedLine.startsWith("0:")) {
                            const content = trimmedLine.slice(2);
                            try {
                                const parsed = JSON.parse(content);
                                // If parsed is a string, use it directly
                                // If parsed is an object, look for text/textDelta properties
                                let textChunk = "";
                                if (typeof parsed === "string") {
                                    textChunk = parsed;
                                } else if (parsed) {
                                    textChunk = parsed.text || parsed.textDelta || "";
                                }
                                if (textChunk) {
                                    accumulatedText += textChunk;
                                    setReview(accumulatedText);
                                }
                            } catch (e) {
                                // Try parsing as plain text if JSON fails
                                if (content.length > 0) {
                                    accumulatedText += content + "\n";
                                    setReview(accumulatedText);
                                }
                            }
                        } else if (trimmedLine.startsWith("d:")) {
                            // Done message - ignore
                            break;
                        } else {
                            // Fallback: treat as plain text
                            accumulatedText += trimmedLine + "\n";
                            setReview(accumulatedText);
                        }
                    }
                }
            } catch (readError) {
                console.error("[CodeReviewer] Stream read error:", readError);
                throw readError;
            }
            
            // Save to history
            await addHistoryEntry({
                toolId: "code-reviewer",
                input: { code, language },
                output: accumulatedText,
                label: `${language} — ${code.slice(0, 40).replace(/\n/g, " ")}...`,
            });
            
        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") {
                console.log("Review cancelled");
            } else {
                const errMsg = err instanceof Error ? err.message : "Unknown error";
                setError(errMsg);
                console.error("[Code Review Error]:", err);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [code, language]);

    const handleStop = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsLoading(false);
    }, []);

    const handleCopy = useCallback(async () => {
        if (!review) return;
        await navigator.clipboard.writeText(review);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }, [review]);

    const handleExport = useCallback(() => {
        if (!review) return;
        const blob = new Blob([`# Code Review\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n## AI Review\n\n${review}`], {
            type: "text/markdown",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `code-review-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }, [code, language, review]);

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* LEFT — Code Editor */}
            <div className="flex flex-col flex-1 min-h-0 border-r border-[var(--border)]">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                    >
                        {LANGUAGE_OPTIONS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>

                    <div className="flex-1" />

                    <button
                        onClick={isLoading ? handleStop : handleReview}
                        disabled={!code.trim()}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40"
                        style={{
                            background: isLoading ? "var(--danger)" : "var(--accent)",
                            color: "white",
                            boxShadow: isLoading ? "none" : "0 0 12px var(--accent-glow)",
                        }}
                    >
                        {isLoading ? (
                            <><RefreshCw size={14} className="animate-spin" /> Stop</>
                        ) : (
                            <><Play size={14} /> Review Code</>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <MonacoEditor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={(v) => setCode(v ?? "")}
                        theme={editorTheme}
                        options={{
                            fontSize,
                            minimap: { enabled: false },
                            wordWrap: "on",
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            padding: { top: 12, bottom: 12 },
                            fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
                            fontLigatures: true,
                            cursorBlinking: "smooth",
                            smoothScrolling: true,
                            renderLineHighlight: "gutter",
                        }}
                    />
                </div>
            </div>

            {/* RIGHT — Review Panel */}
            <div className="flex flex-col w-full lg:w-[420px] min-h-0 bg-[var(--bg-surface)]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] flex-shrink-0 bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-2.5">
                        <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: `${tool.color}20`, color: tool.color }}
                        >
                            <Zap size={14} />
                        </div>
                        <div>
                            <span className="text-sm font-medium text-[var(--text-primary)] block">AI Review</span>
                            {isLoading && (
                                <span className="text-[10px] text-[var(--accent)] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                                    Analyzing code...
                                </span>
                            )}
                        </div>
                    </div>
                    {review && !isLoading && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleCopy}
                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
                                title="Copy review"
                            >
                                {copySuccess ? <CheckCircle size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                            </button>
                            <button
                                onClick={handleExport}
                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
                                title="Export as Markdown"
                            >
                                <Download size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold block mb-0.5">Review Failed</strong>
                                {error}
                            </div>
                        </div>
                    )}
                    
                    {!review && !isLoading && !error && (
                        <div className="flex flex-col items-center gap-4 py-16 text-[var(--text-muted)]">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{ 
                                    background: "linear-gradient(135deg, var(--accent-glow) 0%, rgba(124, 106, 245, 0.05) 100%)",
                                    boxShadow: "0 4px 20px var(--accent-glow)"
                                }}
                            >
                                <Zap size={28} className="text-[var(--accent)]" />
                            </div>
                            <div className="text-center">
                                <span className="text-base font-semibold text-[var(--text-primary)] block mb-1">AI-Powered Code Review</span>
                                <span className="text-xs text-[var(--text-muted)] max-w-[260px] leading-relaxed block">
                                    Get instant feedback on security, performance, bugs, and best practices
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                {[
                                    { label: "Security", icon: "🔒" },
                                    { label: "Performance", icon: "⚡" },
                                    { label: "Best Practices", icon: "✨" },
                                    { label: "Bug Detection", icon: "🐛" },
                                ].map((tag) => (
                                    <span
                                        key={tag.label}
                                        className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                                        style={{ 
                                            background: `linear-gradient(135deg, ${tool.color}15 0%, ${tool.color}08 100%)`, 
                                            color: tool.color,
                                            border: `1px solid ${tool.color}30`
                                        }}
                                    >
                                        <span>{tag.icon}</span>
                                        {tag.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {(review || isLoading) && (
                        <div className="streaming-text text-sm text-[var(--text-primary)] leading-relaxed">
                            <ReactMarkdown
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                    h1: ({ node, ...props }) => (
                                        <h1 className="text-lg font-bold text-[var(--text-primary)] mt-6 mb-3 pb-2 border-b border-[var(--border)]" {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                        <h2 className="text-base font-bold text-[var(--accent)] mt-5 mb-2" {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-1" {...props} />
                                    ),
                                    p: ({ node, ...props }) => (
                                        <p className="mb-3 text-[var(--text-secondary)] leading-relaxed" {...props} />
                                    ),
                                    ul: ({ node, ...props }) => (
                                        <ul className="list-disc list-inside mb-3 space-y-1.5 pl-2" {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                        <ol className="list-decimal list-inside mb-3 space-y-1.5 pl-2" {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                        <li className="text-[var(--text-secondary)]" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => (
                                        <strong className="font-bold text-[var(--text-primary)]" {...props} />
                                    ),
                                    em: ({ node, ...props }) => (
                                        <em className="text-[var(--accent)] italic" {...props} />
                                    ),
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                        if (inline) {
                                            return (
                                                <code className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--accent)] text-xs font-mono border border-[var(--border)]" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                        // Block code - let rehype-highlight handle it, just add wrapper
                                        return (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre: ({ node, children, ...props }: any) => {
                                        return (
                                            <div className="my-4 rounded-lg overflow-hidden border border-[var(--border)]">
                                                <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                                                    <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">JavaScript</span>
                                                </div>
                                                <div className="bg-[#0d1117] overflow-x-auto">
                                                    <pre className="p-4 m-0 text-sm" {...props}>
                                                        {children}
                                                    </pre>
                                                </div>
                                            </div>
                                        );
                                    },
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-3 border-[var(--accent)] pl-4 py-2 my-3 bg-[var(--bg-elevated)] rounded-r-lg text-[var(--text-secondary)] italic" {...props} />
                                    ),
                                    hr: ({ node, ...props }) => (
                                        <hr className="my-4 border-[var(--border)]" {...props} />
                                    ),
                                    a: ({ node, ...props }) => (
                                        <a className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2" {...props} />
                                    ),
                                }}
                            >
                                {review}
                            </ReactMarkdown>
                            {isLoading && <span className="animate-blink text-[var(--accent)] ml-1">▌</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
