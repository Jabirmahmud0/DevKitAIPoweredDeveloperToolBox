"use client";

import { useState, useCallback } from "react";
import chroma from "chroma-js";
import { useCompletion } from "ai/react";
import { Wand2, RefreshCcw, Copy, CheckCircle, MonitorSmartphone } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";

function getContrastColor(hex: string) {
    return chroma.contrast(hex, "white") > 4.5 ? "white" : "black";
}

export default function ColorStudio() {
    const { globalModel } = useToolStore();
    const [palette, setPalette] = useState(["#1A1A1A", "#4A5568", "#A0AEC0", "#E2E8F0", "#F7FAFC"]);
    const [prompt, setPrompt] = useState("A professional corporate tech startup");
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const { complete, isLoading, error } = useCompletion({
        api: "/api/ai/color",
        body: { model: globalModel },
        onFinish: (_, result) => {
            try {
                // The AI is prompted to return JUST a JSON array of 5 hex strings.
                // Sometimes it includes backticks or markdown even when told not to.
                let cleanResult = result.replace(/```(json)?/g, "").trim();
                const colors = JSON.parse(cleanResult);
                if (Array.isArray(colors) && colors.length >= 5) {
                    setPalette(colors.slice(0, 5));
                }
            } catch (e) {
                console.error("Failed to parse AI color palette:", result);
            }
        }
    });

    const generateAIColors = () => {
        complete("", { body: { prompt } });
    };

    const copyColor = (hex: string, index: number) => {
        navigator.clipboard.writeText(hex);
        setCopiedIdx(index);
        setTimeout(() => setCopiedIdx(null), 1500);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            {/* Topbar / AI Generator */}
            <div className="flex flex-col md:flex-row items-center gap-4 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-sm whitespace-nowrap">
                    <Wand2 size={16} /> AI Palette
                </div>
                <div className="flex-1 w-full flex items-center gap-2">
                    <input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe a theme (e.g. Cyberpunk neon city, Ocean breeze...)"
                        className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                        onKeyDown={e => e.key === "Enter" && generateAIColors()}
                    />
                    <button
                        onClick={generateAIColors}
                        disabled={isLoading || !prompt}
                        className="bg-[var(--accent)] hover:opacity-90 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCcw size={16} className="animate-spin" /> : "Generate"}
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {error && (
                    <div className="bg-red-500/10 text-red-500 p-3 text-center text-sm font-medium border-b border-red-500/20">
                        {error.message}
                    </div>
                )}

                {/* Full screen palette pillars */}
                <div className="flex-1 flex flex-col md:flex-row min-h-[400px]">
                    {palette.map((hex, i) => {
                        const textColor = getContrastColor(hex);
                        const c = chroma(hex);
                        const hsl = c.hsl();
                        const rgb = c.rgb();

                        return (
                            <div
                                key={i}
                                className="flex-1 flex flex-col justify-end p-6 transition-all duration-500 ease-out group relative cursor-pointer"
                                style={{ backgroundColor: hex, color: textColor }}
                                onClick={() => copyColor(hex, i)}
                            >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                                <div className="relative z-10 flex flex-col gap-1 items-start md:items-center w-full">
                                    <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tighter font-extrabold uppercase mb-2">
                                        {hex}
                                    </h2>

                                    <div className="flex flex-col font-mono text-xs opacity-80 gap-1 w-full max-w-[150px]">
                                        <div className="flex justify-between border-b border-current/20 pb-1">
                                            <span>RGB</span>
                                            <span>{rgb[0]}, {rgb[1]}, {rgb[2]}</span>
                                        </div>
                                        <div className="flex justify-between pb-1">
                                            <span>HSL</span>
                                            <span>
                                                {isNaN(hsl[0]) ? 0 : Math.round(hsl[0])}°,
                                                {Math.round(hsl[1] * 100)}%,
                                                {Math.round(hsl[2] * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <button className="mt-4 p-2 rounded-full border border-current/30 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 hidden md:block">
                                        {copiedIdx === i ? <CheckCircle size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Preview Section */}
                <div className="bg-[var(--bg-surface)] p-6 lg:p-10 border-t border-[var(--border)] shrink-0 flex flex-col items-center">
                    <div className="w-full max-w-4xl space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] mb-4">
                            <MonitorSmartphone size={16} /> UI Mockup Preview
                        </div>

                        {/* Fake UI */}
                        <div
                            className="w-full rounded-xl border border-black/10 shadow-2xl overflow-hidden flex flex-col"
                            style={{ backgroundColor: palette[4], color: palette[0] }}
                        >
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center" style={{ backgroundColor: palette[0], color: palette[4] }}>
                                <div className="font-bold text-lg tracking-tight">BRAND</div>
                                <div className="flex gap-4 text-sm font-medium">
                                    <span style={{ opacity: 0.8 }}>Home</span>
                                    <span style={{ opacity: 0.8 }}>Features</span>
                                    <span style={{ color: palette[1] }}>Sign In</span>
                                </div>
                            </div>

                            {/* Hero */}
                            <div className="p-12 md:p-20 flex flex-col items-center text-center gap-6">
                                <h1 className="text-4xl md:text-6xl font-extrabold" style={{ color: palette[0] }}>
                                    Build faster with Color
                                </h1>
                                <p className="text-lg md:text-xl max-w-xl" style={{ color: palette[1] }}>
                                    Create stunning, accessible interfaces backed by AI-generated palettes tailored completely to your input prompt.
                                </p>
                                <div className="flex gap-4 mt-4 w-full justify-center">
                                    <button
                                        className="px-6 py-3 rounded-lg font-semibold shadow-lg transition-transform hover:-translate-y-1"
                                        style={{ backgroundColor: palette[2], color: getContrastColor(palette[2]) }}
                                    >
                                        Get Started
                                    </button>
                                    <button
                                        className="px-6 py-3 rounded-lg font-semibold border-2 transition-colors"
                                        style={{ borderColor: palette[2], color: palette[2] }}
                                    >
                                        Learn More
                                    </button>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6" style={{ backgroundColor: palette[3] }}>
                                {[1, 2, 3].map((n) => (
                                    <div key={n} className="p-6 rounded-xl shadow-sm bg-white/50" style={{ color: palette[0] }}>
                                        <div className="w-10 h-10 rounded-full mb-4 opacity-80" style={{ backgroundColor: palette[n % 3] }} />
                                        <h3 className="font-bold text-lg mb-2">Feature {n}</h3>
                                        <div className="h-2 w-full rounded mt-1 opacity-20" style={{ backgroundColor: palette[0] }} />
                                        <div className="h-2 w-2/3 rounded mt-2 opacity-20" style={{ backgroundColor: palette[0] }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
