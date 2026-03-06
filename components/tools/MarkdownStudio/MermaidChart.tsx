"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidChartProps {
    chart: string;
}

export default function MermaidChart({ chart }: MermaidChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const renderChart = async () => {
            try {
                const mermaid = await import("mermaid");
                
                mermaid.default.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    securityLevel: "loose",
                    fontFamily: "var(--font-geist-mono), monospace",
                    themeVariables: {
                        primaryColor: "#7c6af5",
                        primaryTextColor: "#f0f0ff",
                        primaryBorderColor: "#9580ff",
                        lineColor: "#9580ff",
                        secondaryColor: "#1a1a24",
                        tertiaryColor: "#111118",
                    },
                });

                if (!containerRef.current || !mounted) return;

                containerRef.current.innerHTML = "";
                
                const { svg } = await mermaid.default.render(
                    `mermaid-${Date.now()}`,
                    chart
                );

                if (mounted && containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Failed to render diagram");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        renderChart();

        return () => {
            mounted = false;
        };
    }, [chart]);

    if (loading) {
        return (
            <div className="skeleton w-full h-64 rounded-lg my-4" />
        );
    }

    if (error) {
        return (
            <div className="my-4 p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg">
                <p className="text-sm text-[var(--danger)] font-medium">Diagram Error</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{error}</p>
                <pre className="mt-2 text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] p-2 rounded overflow-x-auto">
                    {chart}
                </pre>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className="my-4 flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
        />
    );
}
