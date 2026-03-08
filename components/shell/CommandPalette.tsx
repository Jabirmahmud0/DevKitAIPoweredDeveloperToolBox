"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Terminal } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { useToolStore } from "@/lib/stores/useToolStore";

interface CommandPaletteProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function CommandPalette({ isOpen, onToggle, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState("");
    const { setActiveTool } = useToolStore();

    // Cmd+K to toggle
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                onToggle();
            }
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onToggle, onClose]);

    function handleSelect(toolId: string) {
        setActiveTool(toolId as ReturnType<typeof useToolStore.getState>["activeToolId"]);
        onClose();
        setQuery("");
    }

    const filtered = TOOLS.filter(
        (t) =>
            t.label.toLowerCase().includes(query.toLowerCase()) ||
            t.description.toLowerCase().includes(query.toLowerCase()) ||
            t.tech.some((tech) => tech.toLowerCase().includes(query.toLowerCase()))
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Palette */}
                    <motion.div
                        className="fixed top-[20vh] left-1/2 z-50 w-full max-w-lg -translate-x-1/2"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <Command
                            className="glass rounded-2xl overflow-hidden shadow-2xl"
                            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border)" }}
                        >
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
                                <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                                <Command.Input
                                    value={query}
                                    onValueChange={setQuery}
                                    placeholder="Search tools..."
                                    className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm outline-none"
                                    autoFocus
                                />
                                <kbd className="text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 font-mono">ESC</kbd>
                            </div>

                            <Command.List className="max-h-80 overflow-y-auto p-2">
                                <Command.Empty className="flex flex-col items-center gap-2 py-8 text-[var(--text-muted)] text-sm">
                                    <Terminal size={24} />
                                    No tools found for &ldquo;{query}&rdquo;
                                </Command.Empty>

                                <Command.Group heading={<span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-2 pb-1 block">Developer Tools</span>}>
                                    {filtered.map((tool, idx) => {
                                        const Icon = tool.icon;
                                        return (
                                            <Command.Item
                                                key={tool.id}
                                                value={tool.id}
                                                onSelect={() => handleSelect(tool.id)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 outline-none data-[selected=true]:bg-[var(--bg-overlay)] group"
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${tool.color}20`, color: tool.color }}
                                                >
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-[var(--text-primary)]">{tool.label}</div>
                                                    <div className="text-xs text-[var(--text-muted)] truncate">{tool.description}</div>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    {tool.tech.slice(0, 2).map((t) => (
                                                        <span
                                                            key={t}
                                                            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                                            style={{ background: `${tool.color}20`, color: tool.color }}
                                                        >
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                                <kbd className="text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 font-mono flex-shrink-0">
                                                    ⌘{(idx + 1) % 10}
                                                </kbd>
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>
                            </Command.List>

                            {/* Footer */}
                            <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between">
                                <span className="text-[10px] text-[var(--text-muted)]">10 developer tools</span>
                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                                    <span>Navigate</span>
                                    <kbd className="border border-[var(--border)] rounded px-1 py-0.5 font-mono">↑↓</kbd>
                                    <span>Select</span>
                                    <kbd className="border border-[var(--border)] rounded px-1 py-0.5 font-mono">↵</kbd>
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
