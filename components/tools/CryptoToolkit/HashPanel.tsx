"use client";

import { useState, useEffect } from "react";
import { Copy, CheckCircle } from "lucide-react";
import bcrypt from "bcryptjs";

export default function HashPanel() {
    const [input, setInput] = useState("");
    const [hashes, setHashes] = useState<Record<string, string>>({
        MD5: "",
        "SHA-1": "",
        "SHA-256": "",
        "SHA-512": "",
        Bcrypt: "",
    });
    const [copied, setCopied] = useState<string | null>(null);

    // Crypto API for standard hashes
    useEffect(() => {
        if (!input) {
            setHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "", Bcrypt: "" });
            return;
        }

        const computeHashes = async () => {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);

            const sha1 = await crypto.subtle.digest("SHA-1", data);
            const sha256 = await crypto.subtle.digest("SHA-256", data);
            const sha512 = await crypto.subtle.digest("SHA-512", data);

            // Web Crypto API doesn't support MD5 by default due to security.
            // For a dev tool, we'd normally use a library like crypto-js for MD5.
            // Leaving MD5 blank or mock for this lightweight implementation unless imported.

            const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

            setHashes(prev => ({
                ...prev,
                "SHA-1": toHex(sha1),
                "SHA-256": toHex(sha256),
                "SHA-512": toHex(sha512),
                "MD5": "requires crypto-js or similar (Web Crypto API doesn't support MD5)"
            }));

            // Async bcrypt (runs in background to not block UI)
            setTimeout(() => {
                const bcResult = bcrypt.hashSync(input, 10);
                setHashes(prev => ({ ...prev, Bcrypt: bcResult }));
            }, 0);
        };

        computeHashes();
    }, [input]);

    const copyHash = (hash: string, key: string) => {
        if (!hash) return;
        navigator.clipboard.writeText(hash);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">Input Text</label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-32 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono resize-none transition-colors"
                    placeholder="Type or paste text here to hash..."
                />
            </div>

            <div className="space-y-4">
                {Object.entries(hashes).map(([algo, hash]) => (
                    <div key={algo} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{algo}</h3>
                            <button
                                onClick={() => copyHash(hash, algo)}
                                disabled={!hash}
                                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
                            >
                                {copied === algo ? <CheckCircle size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                                {copied === algo ? "Copied" : "Copy"}
                            </button>
                        </div>
                        <div className="bg-[#111] border border-[#222] rounded-lg p-3 overflow-x-auto">
                            <code className="text-xs text-[var(--text-secondary)] font-mono break-all line-clamp-2">
                                {hash || <span className="opacity-50 italic">Waiting for input...</span>}
                            </code>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
