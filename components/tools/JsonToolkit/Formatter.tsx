"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Play, ClipboardCopy, CheckCircle, Bug, FileDown } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div className="skeleton w-full h-full" />,
});

export default function Formatter() {
    const { fontSize, editorTheme } = useToolStore();
    const [json, setJson] = useState(`{
  "id": 1,
  "name": "DevKit JSON Toolkit",
  "features": ["Format", "Validate", "Diff", "Query", "Schema"],
  "active": true
}`);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    // Auto-validate on change but with debounce
    useEffect(() => {
        const t = setTimeout(() => {
            if (!json.trim()) {
                setError(null);
                return;
            }
            try {
                JSON.parse(json);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            }
        }, 500);
        return () => clearTimeout(t);
    }, [json]);

    const formatJson = useCallback(() => {
        try {
            const parsed = JSON.parse(json);
            setJson(JSON.stringify(parsed, null, 2));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [json]);

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [json]);

    const downloadJson = useCallback(() => {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `formatted-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [json]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                <div className="flex gap-2">
                    <button
                        onClick={formatJson}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-semibold rounded-md shadow-sm hover:opacity-90 transition-opacity"
                    >
                        <Play size={14} /> Format & Validate
                    </button>
                    {error && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-medium rounded-md border border-red-500/20">
                            <Bug size={14} /> Invalid JSON
                        </div>
                    )}
                    {!error && json.trim() && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-md border border-green-500/20">
                            <CheckCircle size={14} /> Valid JSON
                        </div>
                    )}
                </div>
                
                <div className="flex gap-1.5">
                     <button
                        onClick={copyToClipboard}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded transition-colors"
                        title="Copy code"
                    >
                        {copied ? <CheckCircle size={14} className="text-green-500" /> : <ClipboardCopy size={14} />}
                    </button>
                    <button
                        onClick={downloadJson}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded transition-colors"
                        title="Download JSON"
                    >
                        <FileDown size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <MonacoEditor
                    height="100%"
                    language="json"
                    value={json}
                    onChange={(v) => setJson(v || "")}
                    theme={editorTheme}
                    options={{
                        fontSize,
                        minimap: { enabled: true },
                        wordWrap: "on",
                        formatOnPaste: true,
                        autoIndent: "full",
                        padding: { top: 16 }
                    }}
                />
            </div>
        </div>
    );
}
