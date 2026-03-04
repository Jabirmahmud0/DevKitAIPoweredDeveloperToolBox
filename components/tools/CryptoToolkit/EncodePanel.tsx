"use client";

import { useState } from "react";
import { Copy, CheckCircle, ArrowRightLeft } from "lucide-react";

export default function EncodePanel() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<"base64" | "base64url" | "url" | "html">("base64");
    const [action, setAction] = useState<"encode" | "decode">("encode");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const process = () => {
        try {
            setError(null);
            if (!input) {
                setOutput("");
                return;
            }

            if (action === "encode") {
                switch (mode) {
                    case "base64":
                        setOutput(btoa(input));
                        break;
                    case "base64url":
                        setOutput(btoa(input).replace(/\+/g, "-").replace(/\/ /g, "_").replace(/=+$/, ""));
                        break;
                    case "url":
                        setOutput(encodeURIComponent(input));
                        break;
                    case "html":
                        setOutput(input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"));
                        break;
                }
            } else {
                switch (mode) {
                    case "base64":
                        setOutput(atob(input));
                        break;
                    case "base64url":
                        let str = input.replace(/-/g, "+").replace(/_/g, "/");
                        while (str.length % 4) str += "=";
                        setOutput(atob(str));
                        break;
                    case "url":
                        setOutput(decodeURIComponent(input));
                        break;
                    case "html":
                        const doc = new DOMParser().parseFromString(input, "text/html");
                        setOutput(doc.documentElement.textContent || "");
                        break;
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setOutput("");
        }
    };

    const copyOutput = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 lg:h-full lg:flex lg:flex-col">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border)] shrink-0">
                <div className="flex bg-[var(--bg-elevated)] rounded-lg p-1 border border-[var(--border)]">
                    <button
                        onClick={() => setAction("encode")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${action === 'encode' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        Encode
                    </button>
                    <button
                        onClick={() => setAction("decode")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${action === 'decode' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        Decode
                    </button>
                </div>

                <div className="h-6 w-px bg-[var(--border)]" />

                <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg overflow-hidden">
                    {(["base64", "base64url", "url", "html"] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-3 py-1.5 text-xs font-medium uppercase transition-colors border-r border-[#333] last:border-0 ${mode === m ? 'bg-[#333] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[#222]'}`}
                        >
                            {m}
                        </button>
    ))
}
                </div >
            </div >

    {/* Input / Output Area */ }
    < div className = "flex flex-col lg:flex-row gap-6 flex-1 min-h-[400px]" >
        {/* Input */ }
        < div className = "flex-1 flex flex-col" >
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">Input</label>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 text-sm font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none transition-colors"
                        placeholder="Paste text here..."
                    />
                </div >

    {/* Process Button (Mobile block, Desktop Center) */ }
    < div className = "flex justify-center items-center lg:flex-col" >
        <button
            onClick={process}
            className="bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white p-3 rounded-xl shadow-lg transition-transform active:scale-95"
        >
            <ArrowRightLeft size={20} className="lg:rotate-0 rotate-90" />
        </button>
                </div >

    {/* Output */ }
    < div className = "flex-1 flex flex-col" >
                     <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">Output</label>
                        <button
                            onClick={copyOutput}
                            disabled={!output}
                            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                        >
                            {copied ? <CheckCircle size={14} className="text-[var(--success)]" /> : <Copy size={14} />} 
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>
                    <div className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden relative">
                         {error ? (
                            <div className="absolute inset-0 p-4 text-sm font-mono text-red-500 bg-red-500/10 whitespace-pre-wrap flex flex-col justify-center text-center">
                                <strong>Decode Error</strong>
                                <span>{error}</span>
                            </div>
                         ) : (
                            <textarea
                                value={output}
                                readOnly
                                className="w-full h-full bg-transparent p-4 text-sm font-mono text-[var(--text-primary)] resize-none outline-none dark:text-green-400"
                                placeholder={action === "encode" ? "Encoded result..." : "Decoded result..."}
                            />
                         )}
                    </div>
                </div >
            </div >
        </div >
    );
}
