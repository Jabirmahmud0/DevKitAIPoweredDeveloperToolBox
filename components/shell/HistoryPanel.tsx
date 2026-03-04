"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Star, Trash2, RotateCcw, X, StarOff } from "lucide-react";
import { getToolHistory, toggleStar, deleteEntry, clearToolHistory } from "@/lib/db";
import { useToolStore } from "@/lib/stores/useToolStore";
import { TOOL_MAP } from "@/lib/tools";
import type { HistoryEntry } from "@/lib/db";

interface Props {
    open: boolean;
    onClose: () => void;
    onRestore?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ open, onClose, onRestore }: Props) {
    const { activeToolId } = useToolStore();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const tool = TOOL_MAP[activeToolId];

    const loadEntries = useCallback(async () => {
        const data = await getToolHistory(activeToolId);
        setEntries(data);
    }, [activeToolId]);

    useEffect(() => {
        if (open) loadEntries();
    }, [open, loadEntries]);

    async function handleToggleStar(id: number) {
        await toggleStar(id);
        loadEntries();
    }

    async function handleDelete(id: number) {
        await deleteEntry(id);
        loadEntries();
    }

    async function handleClearAll() {
        await clearToolHistory(activeToolId);
        setEntries([]);
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        className="fixed right-0 top-0 bottom-0 z-40 w-80 glass border-l border-[var(--border)] flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
                            <div className="flex items-center gap-2">
                                <History size={16} style={{ color: tool.color }} />
                                <span className="text-sm font-semibold text-[var(--text-primary)]">History</span>
                                <span className="text-xs text-[var(--text-muted)]">{tool.shortLabel}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {entries.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1.5 rounded-lg transition-colors"
                                        title="Clear all history"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Entries */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                            {entries.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-12 text-[var(--text-muted)]">
                                    <History size={32} strokeWidth={1} />
                                    <span className="text-sm">No history yet</span>
                                    <span className="text-xs text-center px-4">
                                        Your last 20 inputs will appear here automatically
                                    </span>
                                </div>
                            ) : (
                                entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="group flex items-start gap-2 p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
                                        onClick={() => onRestore?.(entry)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate leading-snug">
                                                {entry.label ||
                                                    (typeof entry.input === "string"
                                                        ? entry.input.slice(0, 60)
                                                        : JSON.stringify(entry.input).slice(0, 60))}
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                                {new Date(entry.timestamp).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                                {" · "}
                                                {new Date(entry.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRestore?.(entry); }}
                                                className="p-1 rounded-md hover:text-[var(--accent)] text-[var(--text-muted)] transition-colors"
                                                title="Restore"
                                            >
                                                <RotateCcw size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (entry.id) handleToggleStar(entry.id); }}
                                                className="p-1 rounded-md transition-colors"
                                                style={{ color: entry.starred ? "#f59e0b" : "var(--text-muted)" }}
                                                title={entry.starred ? "Unstar" : "Star"}
                                            >
                                                {entry.starred ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (entry.id) handleDelete(entry.id); }}
                                                className="p-1 rounded-md hover:text-[var(--danger)] text-[var(--text-muted)] transition-colors"
                                                title="Delete"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
