"use client";

import { useState } from "react";
import { Code, GitMerge, Search, FileJson2, ArrowRightLeft } from "lucide-react";
import Formatter from "./Formatter";
import DiffView from "./DiffView";
import QueryPanel from "./QueryPanel";
import SchemaGen from "./SchemaGen";
import Converter from "./Converter";

export default function JsonToolkit() {
    const [activeTab, setActiveTab] = useState<"format" | "diff" | "query" | "schema" | "convert">("format");

    const tabs = [
        { id: "format", label: "Formatter & Validator", icon: Code },
        { id: "diff", label: "Diff / Compare", icon: GitMerge },
        { id: "query", label: "Query (JMESPath)", icon: Search },
        { id: "schema", label: "TS/Zod Schema", icon: FileJson2 },
        { id: "convert", label: "Converter", icon: ArrowRightLeft },
    ] as const;

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            {/* Tool-specific Sub-tabs */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: isActive ? "var(--bg-elevated)" : "transparent",
                                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                                border: `1px solid ${isActive ? "var(--border)" : "transparent"}`,
                            }}
                        >
                            <tab.icon size={14} style={{ color: isActive ? "var(--accent)" : "inherit" }} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                {activeTab === "format" && <Formatter />}
                {activeTab === "diff" && <DiffView />}
                {activeTab === "query" && <QueryPanel />}
                {activeTab === "schema" && <SchemaGen />}
                {activeTab === "convert" && <Converter />}
            </div>
        </div>
    );
}
