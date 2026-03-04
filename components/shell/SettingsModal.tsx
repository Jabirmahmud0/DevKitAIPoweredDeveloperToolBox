"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Bot, Type, Palette } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";
import type { EditorTheme } from "@/lib/stores/useToolStore";
import type { AIModel } from "@/lib/ai";

interface Props {
    open: boolean;
    onClose: () => void;
}

const MODEL_OPTIONS: { value: AIModel; label: string; description: string; color: string }[] = [
    { value: "gemini", label: "Gemini 2.0 Flash", description: "Fast, cost-effective, high quality", color: "#4285f4" },
];

const THEME_OPTIONS: { value: EditorTheme; label: string }[] = [
    { value: "vs-dark", label: "VS Dark" },
    { value: "github-dark", label: "GitHub Dark" },
    { value: "monokai", label: "Monokai" },
    { value: "solarized-dark", label: "Solarized" },
];

export function SettingsModal({ open, onClose }: Props) {
    const {
        globalModel, setGlobalModel,
        fontSize, setFontSize,
        editorTheme, setEditorTheme,
    } = useToolStore();

    const [showKeys, setShowKeys] = useState(false);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    >
                        <div
                            className="glass rounded-2xl shadow-2xl overflow-hidden"
                            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border)" }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                                <div className="flex items-center gap-2">
                                    <Settings size={16} className="text-[var(--accent)]" />
                                    <span className="font-semibold text-[var(--text-primary)]">Settings</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">

                                {/* AI Model */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Bot size={14} className="text-[var(--accent)]" />
                                        <span className="text-sm font-medium text-[var(--text-primary)]">Default AI Model</span>
                                    </div>
                                    <div className="space-y-2">
                                        {MODEL_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setGlobalModel(opt.value)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                                                style={{
                                                    background: globalModel === opt.value ? `${opt.color}18` : "var(--bg-elevated)",
                                                    border: `1px solid ${globalModel === opt.value ? opt.color + "40" : "var(--border)"}`,
                                                }}
                                            >
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium" style={{ color: globalModel === opt.value ? opt.color : "var(--text-primary)" }}>
                                                        {opt.label}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)]">{opt.description}</div>
                                                </div>
                                                {globalModel === opt.value && (
                                                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: opt.color }}>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Font Size */}
                                <section>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Type size={14} className="text-[var(--accent)]" />
                                            <span className="text-sm font-medium text-[var(--text-primary)]">Editor Font Size</span>
                                        </div>
                                        <span className="text-sm font-mono text-[var(--accent)]">{fontSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="11"
                                        max="20"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="w-full accent-[var(--accent)]"
                                    />
                                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                                        <span>11px</span><span>20px</span>
                                    </div>
                                </section>

                                {/* Editor Theme */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Palette size={14} className="text-[var(--accent)]" />
                                        <span className="text-sm font-medium text-[var(--text-primary)]">Editor Theme</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {THEME_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setEditorTheme(opt.value)}
                                                className="px-3 py-2 rounded-xl text-sm transition-all duration-150 text-center"
                                                style={{
                                                    background: editorTheme === opt.value ? "var(--accent)" : "var(--bg-elevated)",
                                                    color: editorTheme === opt.value ? "white" : "var(--text-secondary)",
                                                    border: `1px solid ${editorTheme === opt.value ? "transparent" : "var(--border)"}`,
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
