"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { createId as cuid2 } from "@paralleldrive/cuid2";
import { nanoid } from "nanoid";
import { RefreshCw, Copy, CheckCircle } from "lucide-react";

type UuidType = "v4" | "v7" | "cuid2" | "nanoid";

export default function UuidPanel() {
    const [ids, setIds] = useState<string[]>([]);
    const [count, setCount] = useState(10);
    const [type, setType] = useState<UuidType>("v4");
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const generate = () => {
        const newIds = [];
        for (let i = 0; i < count; i++) {
            if (type === "v4") newIds.push(uuidv4());
            // @ts-ignore
            else if (type === "cuid2") newIds.push(cuid2());
            else if (type === "nanoid") newIds.push(nanoid());
        }
        setIds(newIds);
    };

    const copyAll = () => {
        if (!ids.length) return;
        navigator.clipboard.writeText(ids.join("\n"));
        setCopiedIndex(-1);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const copyOne = (id: string, idx: number) => {
        navigator.clipboard.writeText(id);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap gap-4 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border)]">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as UuidType)}
                        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    >
                        <option value="v4">UUID v4 (Random)</option>
                        <option value="cuid2">CUID2 (Collision-resistant)</option>
                        <option value="nanoid">NanoID (Compact, URL-friendly)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 w-32">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Quantity: {count}</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="mt-2 accent-[var(--accent)]"
                    />
                </div>

                <div className="flex items-end flex-1 min-w-[150px]">
                    <button
                        onClick={generate}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw size={16} /> Generate IDs
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col h-[500px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] shrink-0">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{ids.length > 0 ? `Generated ${ids.length} ${type} IDs` : "Results"}</span>
                    {ids.length > 0 && (
                        <button
                            onClick={copyAll}
                            className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium hover:text-[var(--text-primary)] transition-colors"
                        >
                            {copiedIndex === -1 ? <CheckCircle size={14} /> : <Copy size={14} />} Copy All
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#111]">
                    {ids.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                            <span className="text-sm">Click "Generate IDs" to create uniquely identifiable values</span>
                        </div>
                    ) : (
                        ids.map((id, idx) => (
                            <div key={idx} className="flex items-center justify-between group hover:bg-[#222] px-3 py-1.5 rounded transition-colors">
                                <code className="text-sm font-mono text-green-400 select-all">{id}</code>
                                <button
                                    onClick={() => copyOne(id, idx)}
                                    className="p-1.5 rounded text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] transition-all"
                                >
                                    {copiedIndex === idx ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
