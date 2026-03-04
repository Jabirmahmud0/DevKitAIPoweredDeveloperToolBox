"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TOOLS } from "@/lib/tools";
import { useToolStore } from "@/lib/stores/useToolStore";
import type { ToolId } from "@/lib/stores/useToolStore";

export function TabBar() {
    const { activeToolId, setActiveTool } = useToolStore();
    const activeRef = useRef<HTMLButtonElement>(null);

    // Keyboard shortcuts: Cmd/Ctrl + 1-0
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                e.preventDefault();
                setActiveTool(TOOLS[num - 1].id);
            } else if (e.key === "0") {
                e.preventDefault();
                setActiveTool(TOOLS[9].id);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [setActiveTool]);

    // Scroll active tab into view on mobile
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [activeToolId]);

    return (
        <nav
            className="flex items-stretch gap-0.5 overflow-x-auto px-2 pb-0 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
            aria-label="Developer Tools"
        >
            {TOOLS.map((tool, idx) => {
                const isActive = tool.id === activeToolId;
                const Icon = tool.icon;
                return (
                    <button
                        key={tool.id}
                        id={`tab-${tool.id}`}
                        ref={isActive ? activeRef : undefined}
                        onClick={() => setActiveTool(tool.id as ToolId)}
                        title={`${tool.label} (${navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+${(idx + 1) % 10})`}
                        className="relative flex flex-col items-center gap-1 px-3 py-2.5 min-w-[70px] rounded-t-lg text-xs font-medium transition-all duration-200 outline-none group flex-shrink-0"
                        style={{
                            color: isActive ? tool.color : "var(--text-muted)",
                            background: isActive
                                ? "var(--bg-elevated)"
                                : "transparent",
                        }}
                    >
                        {/* Active indicator bar */}
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    layoutId="active-tab-bar"
                                    className="absolute top-0 left-2 right-2 h-0.5 rounded-b-full"
                                    style={{ background: tool.color }}
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0, scaleX: 0 }}
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </AnimatePresence>

                        <Icon
                            size={16}
                            className="transition-transform duration-200 group-hover:scale-110"
                        />
                        <span className="hidden sm:block leading-none">{tool.shortLabel}</span>

                        {/* Hover glow */}
                        {!isActive && (
                            <div
                                className="absolute inset-0 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ background: `${tool.color}0a` }}
                            />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
