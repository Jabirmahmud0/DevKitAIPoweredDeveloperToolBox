"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Shield, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function PasswordPanel() {
    const [password, setPassword] = useState("");
    const [showObj, setShowObj] = useState(false);
    const [score, setScore] = useState(0); // 0-4
    const [feedback, setFeedback] = useState<{ warning: string; suggestions: string[] }>({ warning: "", suggestions: [] });
    const [entropy, setEntropy] = useState(0);

    useEffect(() => {
        analyzePassword(password);
    }, [password]);

    const analyzePassword = (pw: string) => {
        if (!pw) {
            setScore(0);
            setEntropy(0);
            setFeedback({ warning: "", suggestions: ["Enter a password to begin."] });
            return;
        }

        // Extremely simplified entropy calculation for visual demo
        const length = pw.length;
        let poolSize = 0;
        if (/[a-z]/.test(pw)) poolSize += 26;
        if (/[A-Z]/.test(pw)) poolSize += 26;
        if (/[0-9]/.test(pw)) poolSize += 10;
        if (/[^a-zA-Z0-9]/.test(pw)) poolSize += 32;

        const ent = poolSize > 0 ? Math.log2(Math.pow(poolSize, length)) : 0;
        setEntropy(Math.round(ent * 10) / 10);

        // Simple scoring
        let currentScore = 0;
        const hints = [];
        let warn = "";

        if (length > 8) currentScore++;
        else hints.push("Make it longer (at least 12 characters).");

        if (length > 12) currentScore++;

        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) currentScore++;
        else hints.push("Mix uppercase and lowercase letters.");

        if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) currentScore++;
        else hints.push("Include numbers and symbols.");

        if (pw.toLowerCase() === "password" || pw === "12345678" || pw === "qwerty") {
            currentScore = 0;
            warn = "This is a very common password.";
        }

        setScore(Math.min(4, Math.max(0, currentScore)));
        setFeedback({ warning: warn, suggestions: hints });
    };

    const getScoreColor = () => {
        switch (score) {
            case 0: return "var(--danger)";
            case 1: return "var(--danger)";
            case 2: return "var(--warning)";
            case 3: return "var(--info)";
            case 4: return "var(--success)";
            default: return "var(--border)";
        }
    };

    const getScoreLabel = () => {
        if (!password) return "Strength";
        switch (score) {
            case 0: return "Very Weak";
            case 1: return "Weak";
            case 2: return "Fair";
            case 3: return "Good";
            case 4: return "Strong";
            default: return "";
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8 mt-10">
            {/* Input */}
            <div className="relative">
                <div className="flex items-center gap-2 mb-2 text-[var(--text-primary)] font-medium text-sm">
                    <KeyRound size={16} /> Enter Password
                </div>
                <div className="relative">
                    <input
                        type={showObj ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border-2 border-[var(--border)] rounded-xl px-4 py-3.5 text-lg outline-none transition-colors"
                        style={{ borderColor: password ? getScoreColor() : "var(--border)" }}
                        placeholder="••••••••••••"
                    />
                    <button
                        onClick={() => setShowObj(!showObj)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        {showObj ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {/* Strength Meter */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                    <span style={{ color: getScoreColor() }}>{getScoreLabel()}</span>
                    <span className="text-[var(--text-muted)] text-xs font-mono">~{entropy} bits of entropy</span>
                </div>
                <div className="flex gap-2 h-2.5">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className="flex-1 rounded-full transition-colors duration-300"
                            style={{
                                background: score >= s ? getScoreColor() : "var(--bg-elevated)",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Feedback */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                    {score >= 3 ? <ShieldCheck className="text-[var(--success)]" size={18} /> :
                        score > 0 ? <ShieldAlert className="text-[var(--warning)]" size={18} /> :
                            <Shield className="text-[var(--text-muted)]" size={18} />}
                    Feedback
                </div>

                {feedback.warning && (
                    <div className="text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-md border border-red-500/20">
                        {feedback.warning}
                    </div>
                )}

                <ul className="space-y-2">
                    {feedback.suggestions.map((sug, i) => (
                        <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                            <span className="text-[var(--accent)] mt-0.5">•</span> {sug}
                        </li>
                    ))}
                    {password && feedback.suggestions.length === 0 && !feedback.warning && (
                        <li className="text-sm text-[var(--success)] flex items-start gap-2">
                            <CheckCircle size={16} /> Great password! High entopy and complexity.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
