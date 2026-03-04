"use client";

import { useState } from "react";
import * as jose from "jose";
import dynamic from "next/dynamic";
import { CheckCircle, AlertTriangle, Play, Copy } from "lucide-react";
import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
});

export default function JwtPanel() {
    const { fontSize, editorTheme } = useToolStore();
    const [token, setToken] = useState("");
    const [header, setHeader] = useState("");
    const [payload, setPayload] = useState("");
    const [decoded, setDecoded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const decodeToken = () => {
        try {
            setError(null);
            if (!token.trim()) {
                setHeader("");
                setPayload("");
                setDecoded(false);
                return;
            }

            const headerPart = jose.decodeProtectedHeader(token);
            const payloadPart = jose.decodeJwt(token);

            setHeader(JSON.stringify(headerPart, null, 2));
            setPayload(JSON.stringify(payloadPart, null, 2));
            setDecoded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid JWT format");
            setHeader("");
            setPayload("");
            setDecoded(false);
        }
    };

    const copyToken = () => {
        if (!token) return;
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full">
            {/* LEFT — Token Input */}
            <div className="w-full lg:w-1/2 flex flex-col border-r border-[var(--border)] min-h-[300px]">
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Encoded Token</span>
                    <button
                        onClick={copyToken}
                        disabled={!token}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                    >
                        {copied ? <CheckCircle size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-3 relative bg-[var(--bg-default)]">
                    <textarea
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full h-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 font-mono text-sm text-[var(--accent)] outline-none focus:border-[var(--accent)] resize-none break-all"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                        spellCheck={false}
                    />
                    <button
                        onClick={decodeToken}
                        className="absolute bottom-8 right-8 bg-[var(--accent)] text-white px-4 py-2 rounded-lg font-medium text-sm shadow-xl flex items-center gap-2 hover:opacity-90 transition-transform active:scale-95"
                    >
                        <Play size={16} /> Decode JWT
                    </button>
                </div>
            </div>

            {/* RIGHT — Decoded Output */}
            <div className="w-full lg:w-1/2 flex flex-col bg-[#1e1e1e] min-h-[400px]">
                {/* Header */}
                <div className="h-1/3 flex flex-col border-b border-[var(--border)] relative">
                    <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#00000040] text-[10px] font-mono text-[#f87171] uppercase tracking-wider rounded-bl-lg">Header (Algorithm & Type)</div>
                    <div className="flex-1 min-h-0">
                        {error ? (
                            <div className="h-full flex items-center justify-center p-4">
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-3 flex items-center gap-2 text-sm font-mono">
                                    <AlertTriangle size={16} /> {error}
                                </div>
                            </div>
                        ) : decoded ? (
                            <MonacoEditor
                                language="json"
                                value={header}
                                theme={editorTheme}
                                options={{ fontSize, minimap: { enabled: false }, readOnly: true }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-xs p-4 text-center">
                                Paste a JWT on the left to decode
                            </div>
                        )}
                    </div>
                </div>

                {/* Payload */}
                <div className="flex-1 flex flex-col relative bg-[#111]">
                    <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#00000040] text-[10px] font-mono text-[#a78bfa] uppercase tracking-wider rounded-bl-lg">Payload (Data)</div>
                    <div className="flex-1 min-h-0">
                        {decoded && !error && (
                            <MonacoEditor
                                language="json"
                                value={payload}
                                theme={editorTheme}
                                options={{ fontSize, minimap: { enabled: false }, readOnly: true }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
