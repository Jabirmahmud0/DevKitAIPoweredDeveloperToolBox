"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import * as Comlink from "comlink";
import dynamic from "next/dynamic";
import { GitMerge, ArrowRight, CheckCircle, Search, RefreshCcw, ArrowRightLeft } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";
import { DiffResult, DiffLine } from "@/lib/workers/json.worker";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div className="skeleton w-full h-full" />,
});

export default function DiffView() {
    const { fontSize, editorTheme } = useToolStore();
    const [leftJson, setLeftJson] = useState(`{
  "version": 1,
  "status": "pending",
  "features": ["auth", "payments"]
}`);
    const [rightJson, setRightJson] = useState(`{
  "version": 2,
  "status": "active",
  "features": ["auth", "payments", "teams"],
  "createdAt": "2024-03-01"
}`);
    
    const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
    const [isComputing, setIsComputing] = useState(false);
    const [metrics, setMetrics] = useState({ additions: 0, removals: 0, time: 0 });
    const [error, setError] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const diffApiRef = useRef<any>(null);

    // Initialize Web Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL("@/lib/workers/json.worker.ts", import.meta.url));
        diffApiRef.current = Comlink.wrap(workerRef.current);
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const runDiff = useCallback(async () => {
        if (!diffApiRef.current) return;
        setIsComputing(true);
        setError(null);
        
        try {
            const result: DiffResult = await diffApiRef.current.runDiff(leftJson, rightJson);
            if (result.error) {
                setError(result.error);
                setDiffLines([]);
            } else {
                setDiffLines(result.lines);
                setMetrics({ additions: result.additions, removals: result.removals, time: result.executionTime });
            }
        } catch (err) {
            setError("Failed to compute diff");
        } finally {
            setIsComputing(false);
        }
    }, [leftJson, rightJson]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={runDiff}
                        disabled={isComputing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {isComputing ? <RefreshCcw size={14} className="animate-spin" /> : <GitMerge size={14} />}
                        Compare JSON
                    </button>
                    
                    {metrics.time > 0 && !error && (
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-500 font-medium">+{metrics.additions}</span>
                            <span className="text-red-500 font-medium">-{metrics.removals}</span>
                            <span className="text-[var(--text-muted)]">{metrics.time.toFixed(1)}ms</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Split Pane Input Area */}
            <div className="flex flex-row h-[40%] border-b border-[var(--border)]">
                 <div className="flex-1 flex flex-col border-r border-[var(--border)] relative">
                    <div className="absolute top-0 right-0 z-10 p-1 px-3 bg-[#00000040] text-xs text-[var(--text-muted)] font-mono rounded-bl-lg">Original</div>
                    <MonacoEditor
                        height="100%"
                        language="json"
                        value={leftJson}
                        onChange={(v) => setLeftJson(v ?? "")}
                        theme={editorTheme}
                        options={{ fontSize, minimap: { enabled: false } }}
                    />
                 </div>
                 <div className="flex-1 flex flex-col relative">
                    <div className="absolute top-0 right-0 z-10 p-1 px-3 bg-[#00000040] text-xs text-[var(--text-muted)] font-mono rounded-bl-lg">Modified</div>
                    <MonacoEditor
                        height="100%"
                        language="json"
                        value={rightJson}
                        onChange={(v) => setRightJson(v ?? "")}
                        theme={editorTheme}
                        options={{ fontSize, minimap: { enabled: false } }}
                    />
                 </div>
            </div>

            {/* Diff Result List */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg-default)] p-4 font-mono text-sm">
                {error && (
                    <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-sm">
                        {error}
                    </div>
                )}
                {!error && diffLines.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-2">
                        <ArrowRightLeft size={32} opacity={0.5}/>
                        <p>Click Compare JSON to see differences</p>
                    </div>
                )}
                {!error && diffLines.length > 0 && (
                    <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-[#1e1e1e]">
                        {diffLines.map((line, idx) => {
                            let bgColor = "transparent";
                            let textColor = "#d4d4d4";
                            let prefix = "  ";

                            if (line.added) {
                                bgColor = "rgba(34, 197, 94, 0.15)"; // Green tint
                                textColor = "#4ade80";
                                prefix = "+ ";
                            } else if (line.removed) {
                                bgColor = "rgba(239, 68, 68, 0.15)"; // Red tint
                                textColor = "#f87171";
                                prefix = "- ";
                            }

                            // Splitting multiline changes
                            const sublines = line.value.split("\n");
                            // Remove empty last line split from trailing newline
                            if (sublines[sublines.length - 1] === "") {
                                sublines.pop();
                            }

                            return sublines.map((sub, sIdx) => (
                                <div key={`${idx}-${sIdx}`} className="flex whitespace-pre" style={{ backgroundColor: bgColor, color: textColor }}>
                                    <span className="w-8 text-right pr-2 select-none opacity-50 border-r border-[#333] mr-4">{idx + 1}</span>
                                    <span className="select-none inline-block w-4">{prefix}</span>
                                    <span className="flex-1">{sub}</span>
                                </div>
                            ));
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
