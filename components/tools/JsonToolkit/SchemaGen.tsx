"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useToolStore } from "@/lib/stores/useToolStore";
import { FileJson2, Play, Code2, ClipboardCopy } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
});

export default function SchemaGen() {
    const { fontSize, editorTheme, globalModel } = useToolStore();
    const [json, setJson] = useState(`{
  "id": "usr_123",
  "profile": {
    "name": "Jane Doe",
    "age": 28
  },
  "roles": ["admin", "editor"],
  "isActive": true
}`);
    const [schema, setSchema] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateSchema = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/json", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ json, model: globalModel }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.details || "Failed to generate schema");
            }

            setSchema(data.code || "");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate schema");
        } finally {
            setIsLoading(false);
        }
    }, [json, globalModel]);

    const handleCopy = () => {
        navigator.clipboard.writeText(schema);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            <div className="flex px-4 py-3 shrink-0 items-center gap-4 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                <button
                    onClick={generateSchema}
                    disabled={isLoading || !json.trim()}
                    className="bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                    {isLoading ? <span className="animate-pulse">Generating...</span> : <><Play size={14} /> AI Generate TS/Zod</>}
                </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0 border-b border-[var(--border)]">
                {/* Input JSON */}
                <div className="flex-1 flex flex-col border-r border-[var(--border)]">
                     <div className="bg-[var(--bg-surface)] px-3 py-1.5 border-b border-[var(--border)] text-xs font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                        <FileJson2 size={12} /> Source JSON
                     </div>
                     <div className="flex-1 min-h-0 relative">
                        <MonacoEditor
                            language="json"
                            value={json}
                            onChange={(v) => setJson(v ?? "")}
                            theme={editorTheme}
                            options={{ fontSize, minimap: { enabled: false } }}
                        />
                     </div>
                </div>
                
                {/* Output Schema */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                     <div className="bg-[var(--bg-surface)] px-3 py-1.5 border-b border-[var(--border)] text-xs font-mono text-[var(--text-muted)] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Code2 size={12} /> TypeScript / Zod
                        </div>
                        {schema && (
                            <button onClick={handleCopy} className="text-xs hover:text-[var(--text-primary)] transition-colors">
                                {copied ? "Copied!" : <ClipboardCopy size={12} />}
                            </button>
                        )}
                     </div>
                     <div className="flex-1 min-h-0 relative">
                        {error ? (
                            <div className="p-4 text-red-400 font-mono text-sm whitespace-pre-wrap">{error}</div>
                        ) : schema ? (
                            <MonacoEditor
                                language="typescript"
                                value={schema}
                                theme={editorTheme}
                                options={{ fontSize, readOnly: true, minimap: { enabled: false } }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 font-mono text-sm p-4 text-center">
                                <Code2 size={32} className="opacity-30" />
                                Click "AI Generate" to create a strict TS interface<br />and Zod schema based on your JSON.
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
}
