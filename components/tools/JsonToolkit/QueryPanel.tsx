"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import jmespath from "jmespath";
import { TerminalSquare, Play, Info } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
});

export default function QueryPanel() {
    const { fontSize, editorTheme } = useToolStore();
    const [json, setJson] = useState(`{
  "locations": [
    {"state": "WA", "name": "Seattle", "population": 737015},
    {"state": "OR", "name": "Portland", "population": 652503},
    {"state": "CA", "name": "San Francisco", "population": 873965}
  ]
}`);
    const [query, setQuery] = useState("locations[?population > `700000`].name");
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const executeQuery = () => {
        try {
            const parsedJson = JSON.parse(json);
            const res = jmespath.search(parsedJson, query);
            setResult(JSON.stringify(res, null, 2));
            setError(null);
        } catch (err) {
            setError(String(err));
            setResult(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
             <div className="flex gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] shrink-0">
                <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1">
                        <TerminalSquare size={14}/> JMESPath Expression
                    </label>
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono focus:border-[var(--accent)] outline-none text-[var(--text-primary)] transition-colors"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && executeQuery()}
                            placeholder="e.g. locations[?population > `700000`].name"
                        />
                        <button 
                            onClick={executeQuery}
                            className="bg-[var(--accent)] text-white px-4 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                            <Play size={14} /> Run
                        </button>
                    </div>
                </div>
             </div>

             <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                <div className="flex-1 flex flex-col border-r border-[var(--border)] relative">
                    <div className="bg-[var(--bg-surface)] px-3 py-1 border-b border-[var(--border)] text-xs font-mono text-[var(--text-muted)]">Input JSON</div>
                    <div className="flex-1 overflow-hidden">
                        <MonacoEditor
                            language="json"
                            value={json}
                            onChange={v => setJson(v || "")}
                            theme={editorTheme}
                            options={{ fontSize, minimap: { enabled: false } }}
                        />
                    </div>
                </div>
                <div className="flex-1 flex flex-col relative bg-[var(--bg-surface)]">
                    <div className="bg-[var(--bg-surface)] px-3 py-1 border-b border-[var(--border)] text-xs font-mono text-[var(--text-muted)]">Query Result</div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                        {error ? (
                            <div className="text-red-500">{error}</div>
                        ) : result ? (
                            <div className="text-[var(--text-primary)]">{result}</div>
                        ) : (
                            <div className="text-[var(--text-muted)] flex items-center justify-center h-full flex-col gap-2">
                                <Info size={24} opacity={0.5}/>
                                Enter a query and run it
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
}
