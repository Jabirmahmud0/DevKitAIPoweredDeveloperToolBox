"use client";

import { useState } from "react";
import { Hash, Key, Fingerprint, Lock, ShieldCheck, Binary } from "lucide-react";
import HashPanel from "./HashPanel";
import EncodePanel from "./EncodePanel";
import JwtPanel from "./JwtPanel";
import UuidPanel from "./UuidPanel";
import PasswordPanel from "./PasswordPanel";
import EncryptPanel from "./EncryptPanel";

export default function CryptoToolkit() {
    const [activeTab, setActiveTab] = useState<"hash" | "encode" | "jwt" | "uuid" | "password" | "encrypt">("hash");

    const tabs = [
        { id: "hash", label: "Hash Generator", icon: Hash },
        { id: "encode", label: "Encode / Decode", icon: Binary },
        { id: "jwt", label: "JWT Debugger", icon: Key },
        { id: "uuid", label: "UUID Generator", icon: Fingerprint },
        { id: "password", label: "Password Strength", icon: ShieldCheck },
        { id: "encrypt", label: "Encrypt / Decrypt", icon: Lock },
    ] as const;

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            {/* Tool-specific Sub-tabs */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: isActive ? "var(--bg-elevated)" : "transparent",
                                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                                border: `1px solid ${isActive ? "var(--border)" : "transparent"}`,
                            }}
                        >
                            <tab.icon size={14} style={{ color: isActive ? "var(--accent)" : "inherit" }} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto relative">
        {activeTab === "hash" && <HashPanel />}
        {activeTab === "encode" && <EncodePanel />}
        {activeTab === "jwt" && <JwtPanel />}
        {activeTab === "uuid" && <UuidPanel />}
        {activeTab === "password" && <PasswordPanel />}
        {activeTab === "encrypt" && <EncryptPanel />}
    </div>
    </div>
    );
}
