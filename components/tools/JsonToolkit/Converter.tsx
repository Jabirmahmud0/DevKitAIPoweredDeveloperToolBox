"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRightLeft, FileSpreadsheet, AlignLeft, Download } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
});

export default function Converter() {
    const { fontSize, editorTheme } = useToolStore();
    const [json, setJson] = useState(`[
  {"id": 1, "name": "Alice", "role": "admin"},
  {"id": 2, "name": "Bob", "role": "user"}
]`);
    const [result, setResult] = useState("");
    const [resultType, setResultType] = useState<"csv" | "minified">("csv");
    const [error, setError] = useState<string | null>(null);

    const checkRootArray = (obj: any) => {
        if (!Array.isArray(obj)) throw new Error("Root element must be an array of objects to convert to CSV");
        if (obj.length > 0 && typeof obj[0] !== "object") throw new Error("Root array must contain objects");
    };

    const handleToCsv = () => {
        try {
            setError(null);
            const parsed = JSON.parse(json);
            checkRootArray(parsed);
            
            if (parsed.length === 0) {
                setResult("");
                setResultType("csv");
                return;
            }

            const headers = Object.keys(parsed[0]);
            const rows = parsed.map((item: any) => {
                return headers.map(header => {
                    const val = item[header];
                    // Escape basic CSV fields
                    if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                         return `"${val.replace(/"/g, '""')}"`;
                    }
                    if (val === null || val === undefined) return "";
                    if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
                    return String(val);
                }).join(",");
            });

            setResult([headers.join(","), ...rows].join("\n"));
            setResultType("csv");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleToMinified = () => {
        try {
            setError(null);
            const parsed = JSON.parse(json);
            setResult(JSON.stringify(parsed));
            setResultType("minified");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const downloadResult = () => {
        if (!result) return;
        const blob = new Blob([result], { type: resultType === "csv" ? "text/csv" : "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `converted.${resultType === "csv" ? "csv" : "min.json"}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
                <button
                    onClick={handleToCsv}
                    className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded bg-[#10b981] text-white hover:opacity-90 transition-opacity"
                >
                    <FileSpreadsheet size={14} /> To CSV
                </button>
                <button
                    onClick={handleToMinified}
                    className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
                >
                    <AlignLeft size={14} /> Minify JSON
                </button>
                <div className="flex-1" />
                {result && (
                    <button
                        onClick={downloadResult}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Download file"
                    >
                        <Download size={16} />
                    </button>
                )}
            </div>
            
            {/* Split Pane */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Input */}
                <div className="flex-1 flex flex-col border-r border-[var(--border)] relative">
                    <div className="absolute top-0 right-0 z-10 px-2 py-1 bg-[#00000060] text-[10px] font-mono text-[var(--text-muted)] rounded-bl-lg">Input JSON</div>
                    <MonacoEditor
                        language="json"
                        value={json}
                        onChange={v => setJson(v || "")}
                        theme={editorTheme}
                        options={{ fontSize, minimap: { enabled: false } }}
                    />
                </div>
                {/* Output */}
                <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                    <div className="absolute top-0 right-0 z-10 px-2 py-1 bg-[#11111160] text-[10px] font-mono text-[var(--text-muted)] rounded-bl-lg">
                        {resultType === "csv" ? "CSV Output" : "Minified JSON"}
                    </div>
                    {error ? (
                        <div className="p-4 text-red-500 font-mono text-sm">{error}</div>
                    ) : (
                         <div className="flex-1 p-4 font-mono text-sm whitespace-pre-wrap overflow-y-auto text-[#d4d4d4] select-all">
                            {result || <span className="text-zinc-500">Output will appear here...</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
