"use client";

import { useState } from "react";
import CryptoJS from "crypto-js";
import { Lock, Unlock, Copy, CheckCircle } from "lucide-react";

export default function EncryptPanel() {
    const [text, setText] = useState("");
    const [secret, setSecret] = useState("");
    const [result, setResult] = useState("");
    const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const process = () => {
        try {
            setError(null);
            if (!text || !secret) {
                setResult("");
                return;
            }

            if (mode === "encrypt") {
                const encrypted = CryptoJS.AES.encrypt(text, secret).toString();
                setResult(encrypted);
            } else {
                const decrypted = CryptoJS.AES.decrypt(text, secret);
                const originalText = decrypted.toString(CryptoJS.enc.Utf8);
                if (!originalText) throw new Error("Decryption failed. Invalid secret or malformed payload.");
                setResult(originalText);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred during processing.");
            setResult("");
        }
    };

    const copyResult = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 lg:h-full lg:flex lg:flex-col">
            <div className="flex flex-wrap gap-4">
                <div className="flex bg-[var(--bg-elevated)] rounded-lg p-1 border border-[var(--border)] shrink-0">
                     <button
                        onClick={() => { setMode("encrypt"); setResult(""); setError(null); }}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'encrypt' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Lock size={14} /> Encrypt
                    </button>
                    <button
                        onClick={() => { setMode("decrypt"); setResult(""); setError(null); }}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'decrypt' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Unlock size={14} /> Decrypt
                    </button>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <input
                            type="password"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Secret Key (passphrase)..."
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                </div>

                <button
                    onClick={process}
                    disabled={!text || !secret}
                    className="bg-[var(--accent)] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {mode === "encrypt" ? "Encrypt Data" : "Decrypt Data"}
                </button>
            </div >

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[300px]">
            <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                    {mode === "encrypt" ? "Plain Text Input" : "Encrypted Payload Input"}
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 text-sm font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none transition-colors"
                    placeholder={mode === "encrypt" ? "Type sensitive data here..." : "U2FsdGVkX1..."}
                />
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--text-primary)] block">Result</label>
                    <button
                        onClick={copyResult}
                        disabled={!result}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                    >
                        {copied ? <CheckCircle size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
                <div className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl relative overflow-hidden">
                    {error ? (
                        <div className="absolute inset-0 p-4 font-mono text-sm text-red-500 bg-red-500/10 flex items-center justify-center text-center">
                            {error}
                        </div>
                    ) : (
                        <textarea
                            value={result}
                            readOnly
                            className="w-full h-full bg-transparent p-4 text-sm font-mono text-[#4ade80] outline-none resize-none break-all"
                            placeholder="Output will appear here..."
                        />
                    )}
                </div>
            </div>
        </div>
        </div >
    );
}
