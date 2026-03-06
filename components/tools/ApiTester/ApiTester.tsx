"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Play, Plus, Trash2, Wand2, RefreshCcw, Activity, Loader2 } from "lucide-react";
import { useCompletion } from "ai/react";
import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type KeyVal = { id: string; key: string; value: string; active: boolean };
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function ApiTester() {
    const { fontSize, editorTheme, globalModel } = useToolStore();

    // Request State
    const [method, setMethod] = useState<HttpMethod>("GET");
    const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
    const [headers, setHeaders] = useState<KeyVal[]>([{ id: "1", key: "Accept", value: "application/json", active: true }]);
    const [params, setParams] = useState<KeyVal[]>([]);
    const [body, setBody] = useState("");
    const [activeTab, setActiveTab] = useState<"params" | "headers" | "body">("params");

    // Response State
    const [response, setResponse] = useState("");
    const [status, setStatus] = useState<number | null>(null);
    const [time, setTime] = useState<number | null>(null);
    const [size, setSize] = useState<number | null>(null);
    const [isSending, setIsSending] = useState(false);

    // AI Assistant
    const [aiPrompt, setAiPrompt] = useState("");
    const [showAi, setShowAi] = useState(false);

    const { complete, isLoading: aiLoading } = useCompletion({
        api: "/api/ai/api-builder",
        onFinish: (_, result) => {
            try {
                let clean = result.replace(/```(json)?/g, "").trim();
                const data = JSON.parse(clean);
                if (data.method) setMethod(data.method);
                if (data.url) {
                    const fullUrl = data.url.startsWith("http") ? data.url : `https://jsonplaceholder.typicode.com${data.url}`;
                    setUrl(fullUrl);
                }
                if (data.headers) setHeaders(data.headers.map((h: any, i: number) => ({ id: `h${i}`, ...h })));
                if (data.params) setParams(data.params.map((p: any, i: number) => ({ id: `p${i}`, ...p })));
                if (data.body) {
                    setBody(typeof data.body === "string" ? data.body : JSON.stringify(data.body, null, 2));
                    setActiveTab("body");
                }
                setShowAi(false);
            } catch (e) {
                console.error("[AI Builder] Failed to parse AI response:", result, e);
            }
        }
    });

    const addField = (type: "headers" | "params") => {
        const newItem = { id: Date.now().toString(), key: "", value: "", active: true };
        if (type === "headers") setHeaders([...headers, newItem]);
        else setParams([...params, newItem]);
    };

    const updateField = (type: "headers" | "params", id: string, field: keyof KeyVal, val: any) => {
        const setter = type === "headers" ? setHeaders : setParams;
        setter(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };

    const removeField = (type: "headers" | "params", id: string) => {
        const setter = type === "headers" ? setHeaders : setParams;
        setter(prev => prev.filter(p => p.id !== id));
    };

    const sendRequest = async () => {
        setIsSending(true);
        setStatus(null);
        setTime(null);
        setSize(null);
        setResponse("");

        try {
            // Build URL with params
            const finalUrl = new URL(url);
            params.filter(p => p.active && p.key).forEach(p => {
                finalUrl.searchParams.append(p.key, p.value);
            });

            // Build Headers
            const reqHeaders: Record<string, string> = {};
            headers.filter(h => h.active && h.key).forEach(h => {
                reqHeaders[h.key] = h.value;
            });

            const startTime = performance.now();

            const res = await fetch(finalUrl.toString(), {
                method,
                headers: reqHeaders,
                body: (method !== "GET" && method !== "HEAD" && body) ? body : undefined
            });

            const endTime = performance.now();
            setTime(Math.round(endTime - startTime));
            setStatus(res.status);

            const contentType = res.headers.get("content-type");
            let data;
            
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
                const str = JSON.stringify(data, null, 2);
                setResponse(str);
                setSize(new Blob([str]).size);
            } else {
                data = await res.text();
                setResponse(data);
                setSize(new Blob([data]).size);
            }

        } catch (err) {
            setResponse(err instanceof Error ? err.message : String(err));
            setStatus(0); // network error
        } finally {
            setIsSending(false);
        }
    };

    const renderKeyValueEditor = (type: "headers" | "params", items: KeyVal[]) => (
        <div className="flex flex-col gap-2 p-4 h-full overflow-y-auto">
            {items.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        checked={item.active} 
                        onChange={e => updateField(type, item.id, "active", e.target.checked)}
                        className="accent-[var(--accent)] cursor-pointer"
                    />
                    <input 
                        placeholder="Key" 
                        value={item.key} 
                        onChange={e => updateField(type, item.id, "key", e.target.value)}
                        className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono outline-none focus:border-[var(--accent)]"
                    />
                    <input 
                        placeholder="Value" 
                        value={item.value} 
                        onChange={e => updateField(type, item.id, "value", e.target.value)}
                        className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono outline-none focus:border-[var(--accent)]"
                    />
                    <button onClick={() => removeField(type, item.id)} className="p-2 text-[var(--text-muted)] hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button 
                onClick={() => addField(type)}
                className="self-start flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mt-2"
            >
                <Plus size={14} /> Add {type === "headers" ? "Header" : "Parameter"}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            {/* Top Bar: URL & Methods */}
            <div className="flex items-center gap-2 p-4 bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0">
                <div className="flex items-center border border-[var(--border)] rounded-lg bg-[var(--bg-elevated)] focus-within:border-[var(--accent)] transition-colors overflow-hidden flex-1">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                        className="bg-transparent text-[var(--accent)] font-bold text-sm outline-none px-3 py-2 cursor-pointer border-r border-[var(--border)]"
                    >
                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input 
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://api.example.com/v1/users"
                        className="flex-1 bg-transparent px-4 py-2 text-sm font-mono text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                        onKeyDown={e => e.key === "Enter" && sendRequest()}
                    />
                </div>
                <button
                    onClick={sendRequest}
                    disabled={isSending || !url}
                    className="flex justify-center items-center gap-2 bg-[var(--accent)] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[100px]"
                >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    Send
                </button>
                <button
                    onClick={() => setShowAi(!showAi)}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${showAi ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    title="AI Request Builder"
                >
                    <Wand2 size={18} />
                </button>
            </div>

            {/* AI Panel */}
            {showAi && (
                <div className="bg-[#1e1e1e] border-b border-[var(--border)] p-4 shrink-0 shadow-inner flex items-center gap-3">
                    <Wand2 size={16} className="text-[var(--accent)] shrink-0" />
                    <input
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        placeholder="e.g., 'POST request to create a new user with name John and role admin at api.example.com'"
                        onKeyDown={e => e.key === "Enter" && complete("", { body: { prompt: aiPrompt } })}
                    />
                    <button
                        onClick={() => complete("", { body: { prompt: aiPrompt } })}
                        disabled={aiLoading || !aiPrompt}
                        className="bg-[var(--accent)] text-white px-4 py-1.5 rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                        {aiLoading ? <RefreshCcw size={14} className="animate-spin" /> : "Build"}
                    </button>
                    <button onClick={() => setShowAi(false)} className="text-zinc-500 hover:text-white px-2">×</button>
                </div>
            )}

            {/* Editor & Response Area */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Request Config */}
                <div className="flex-1 flex flex-col border-[var(--border)] md:border-r min-h-[50%] md:min-h-0">
                    <div className="flex gap-1 p-2 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
                        {(["params", "headers", "body"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            >
                                {tab}
                                {tab === "params" && params.length > 0 && <span className="ml-1.5 text-[10px] bg-[var(--border)] px-1.5 py-0.5 rounded-full">{params.length}</span>}
                                {tab === "headers" && headers.length > 0 && <span className="ml-1.5 text-[10px] bg-[var(--border)] px-1.5 py-0.5 rounded-full">{headers.length}</span>}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1 min-h-0 relative">
                        {activeTab === "params" && renderKeyValueEditor("params", params)}
                        {activeTab === "headers" && renderKeyValueEditor("headers", headers)}
                        {activeTab === "body" && (
                            <div className="w-full h-full relative">
                                <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#00000040] text-[10px] font-mono text-[var(--text-muted)] rounded-bl-lg">JSON</div>
                                <MonacoEditor
                                    language="json"
                                    value={body}
                                    onChange={v => setBody(v || "")}
                                    theme={editorTheme}
                                    options={{ fontSize, minimap: { enabled: false } }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Response View */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                    <div className="flex items-center justify-between p-2 lg:px-4 lg:py-2.5 bg-[var(--bg-surface)] border-b border-[#333] shrink-0">
                        <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5"><Activity size={14}/> Response</span>
                        <div className="flex items-center gap-3 text-xs font-mono font-medium">
                            <span className={`px-2 py-0.5 rounded ${status && status >= 200 && status < 300 ? 'bg-green-500/10 text-green-400' : status && status >= 400 ? 'bg-red-500/10 text-red-400' : 'text-zinc-500'}`}>
                                Status: {status || "---"}
                            </span>
                            <span className="text-zinc-400">Time: {time ? `${time}ms` : "---"}</span>
                            <span className="text-zinc-400">Size: {size ? `${(size / 1024).toFixed(2)} KB` : "---"}</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative bg-[#111]">
                        {!response && !isSending ? (
                             <div className="h-full flex items-center justify-center text-zinc-600 text-sm font-mono italic">
                                 Hit Send to get a response...
                             </div>
                        ) : isSending ? (
                             <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3 text-sm font-mono">
                                 <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                                 Sending request...
                             </div>
                        ) : (
                             <MonacoEditor
                                language={response.startsWith("{") || response.startsWith("[") ? "json" : "html"}
                                value={response}
                                theme={editorTheme}
                                options={{ fontSize, minimap: { enabled: false }, readOnly: true, wordWrap: "on" }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
