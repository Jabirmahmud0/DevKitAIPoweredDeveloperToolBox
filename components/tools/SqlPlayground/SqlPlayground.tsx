"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Play, Download, RefreshCw, Database, Table, Trash2, Wand2 } from "lucide-react";
import { useCompletion } from "ai/react";
import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false, loading: () => <div className="skeleton w-full h-full" /> });

// Sample datasets
const SAMPLE_DATASETS: Record<string, { create: string; insert: string; description: string }> = {
    users: {
        description: "Users & Orders",
        create: `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER, country TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product TEXT, amount REAL, date TEXT);`,
        insert: `INSERT INTO users VALUES (1,'Alice Johnson','alice@example.com',28,'USA'),(2,'Bob Smith','bob@example.com',35,'UK'),(3,'Carol White','carol@example.com',22,'Canada'),(4,'David Brown','david@example.com',41,'Australia'),(5,'Eva Martinez','eva@example.com',30,'Spain');
INSERT INTO orders VALUES (1,1,'Laptop',1299.99,'2024-01-15'),(2,1,'Mouse',29.99,'2024-01-20'),(3,2,'Keyboard',89.99,'2024-02-01'),(4,3,'Monitor',399.99,'2024-02-10'),(5,4,'Headphones',149.99,'2024-02-15'),(6,5,'Webcam',79.99,'2024-03-01'),(7,2,'Laptop',1299.99,'2024-03-05');`,
    },
    products: {
        description: "Products & Inventory",
        create: `CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER, rating REAL);`,
        insert: `INSERT INTO products VALUES (1,'MacBook Pro','Electronics',2499.99,15,4.8),(2,'iPhone 15','Electronics',999.99,50,4.6),(3,'AirPods Pro','Electronics',249.99,100,4.7),(4,'Standing Desk','Furniture',799.99,20,4.5),(5,'Ergonomic Chair','Furniture',499.99,30,4.4),(6,'Mechanical Keyboard','Electronics',149.99,75,4.6),(7,'4K Monitor','Electronics',599.99,25,4.7),(8,'Notebook','Stationery',9.99,500,4.2);`,
    },
};

type Row = Record<string, unknown>;

export default function SqlPlayground() {
    const { fontSize, editorTheme, globalModel } = useToolStore();
    const [sql, setSql] = useState(`-- Try a query on the sample dataset!\nSELECT u.name, u.country, COUNT(o.id) as orders, SUM(o.amount) as total_spent\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id\nORDER BY total_spent DESC;`);
    const [results, setResults] = useState<Row[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [execTime, setExecTime] = useState<number | null>(null);
    const [activeDataset, setActiveDataset] = useState<string | null>(null);
    
    // AI Query Builder
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const { complete, completion, isLoading: isAiLoading } = useCompletion({ api: "/api/ai/sql" });
    
    const dbRef = useRef<any>(null);
    const SQLRef = useRef<any>(null);

    // Initialize sql.js
    useEffect(() => {
        let cancelled = false;
        async function init() {
            try {
                // Import sql.js
                const initSqlJs = (await import("sql.js")).default;
                
                // Use unpkg CDN for the WASM file (more reliable)
                const SQL = await initSqlJs({
                    locateFile: (file: string) => {
                        if (file.endsWith('.wasm')) {
                            return `https://unpkg.com/sql.js@1.14.0/dist/sql-wasm.wasm`;
                        }
                        return `https://unpkg.com/sql.js@1.14.0/dist/${file}`;
                    },
                });
                
                if (!cancelled) {
                    SQLRef.current = SQL;
                    const db = new SQL.Database();
                    dbRef.current = db;
                    // Load default dataset
                    loadDataset("users", db, SQL);
                    console.log("[SQL Playground] Initialized successfully");
                }
            } catch (err) {
                console.error("[SQL Playground] Init failed:", err);
                setError("Failed to load SQL engine. Please refresh the page.");
            }
        }
        init();
        return () => { cancelled = true; };
    }, []);

    function loadDataset(key: string, db?: unknown, SQL?: unknown) {
        const targetDb = db || dbRef.current;
        const targetSQL = SQL || SQLRef.current;
        if (!targetDb || !targetSQL) return;
        const dataset = SAMPLE_DATASETS[key];
        if (!dataset) return;
        try {
            const freshDb = new targetSQL.Database();
            freshDb.run(dataset.create);
            freshDb.run(dataset.insert);
            dbRef.current = freshDb;
            setActiveDataset(key);
            setResults([]);
            setColumns([]);
            setError(null);
        } catch (err) {
            setError(String(err));
        }
    }

    const handleAiQuery = () => {
        if (!aiPrompt) return;
        setShowAiPanel(true);
        complete("", {
            body: {
                prompt: aiPrompt,
                dataset: activeDataset || "users",
                model: globalModel
            }
        });
    };

    const applyAiQuery = () => {
        if (completion) {
            // Extract SQL from the response (look for code blocks or just use the response)
            const sqlMatch = completion.match(/```sql\s*([\s\S]*?)\s*```/i);
            const extractedSql = sqlMatch ? sqlMatch[1].trim() : completion.trim();
            setSql(extractedSql);
            setShowAiPanel(false);
            setAiPrompt("");
        }
    };

    function runQuery() {
        if (!dbRef.current) return;
        setIsLoading(true);
        setError(null);
        const start = performance.now();
        try {
            const queryResults = dbRef.current.exec(sql);
            const elapsed = performance.now() - start;
            setExecTime(elapsed);
            
            if (!queryResults || queryResults.length === 0) {
                setResults([]);
                setColumns([]);
                setError(null);
            } else {
                const firstResult = queryResults[0];
                
                // sql.js returns: { lc: string[], values: any[] } where lc = lowercase column names
                const cols = firstResult?.lc || firstResult?.columns || firstResult?.keys || [];
                const values = firstResult?.values || [];
                
                setColumns(cols);
                setResults(
                    values.map((row: unknown[]) =>
                        Object.fromEntries(cols.map((c: string, i: number) => [c, row[i]]))
                    )
                );
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
            setResults([]);
            setColumns([]);
            setExecTime(null);
        } finally {
            setIsLoading(false);
        }
    }

    function exportCSV() {
        if (!results.length) return;
        const csv = [columns.join(","), ...results.map((r) => columns.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `query-result-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar — Schema Explorer */}
            <div className="w-48 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] flex flex-col hidden md:flex">
                <div className="px-3 py-2.5 border-b border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Datasets</span>
                </div>
                <div className="p-2 space-y-1">
                    {Object.entries(SAMPLE_DATASETS).map(([key, ds]) => (
                        <button
                            key={key}
                            onClick={() => loadDataset(key)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-all"
                            style={{
                                background: activeDataset === key ? "var(--accent-glow)" : "transparent",
                                color: activeDataset === key ? "var(--accent)" : "var(--text-secondary)",
                            }}
                        >
                            <Database size={12} />
                            {ds.description}
                        </button>
                    ))}
                </div>
                {activeDataset && (
                    <div className="px-3 py-2 border-t border-[var(--border)] mt-auto">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Tables</div>
                        {activeDataset === "users" ? (
                            <>
                                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mb-1"><Table size={10} /> users</div>
                                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5"><Table size={10} /> orders</div>
                            </>
                        ) : (
                            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5"><Table size={10} /> products</div>
                        )}
                    </div>
                )}
            </div>

            {/* Main area */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* SQL Editor */}
                <div className="h-48 border-b border-[var(--border)] flex flex-col flex-shrink-0">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
                        <span className="text-xs text-[var(--text-muted)] font-mono">SQL</span>
                        <div className="flex-1" />
                        <button
                            onClick={() => setShowAiPanel(!showAiPanel)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${showAiPanel ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                        >
                            <Wand2 size={12} /> AI Query
                        </button>
                        <button
                            onClick={runQuery}
                            disabled={isLoading || !dbRef.current}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                            style={{ background: "var(--accent)", color: "white" }}
                        >
                            {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                            {isLoading ? "Running..." : "Run Query"}
                        </button>
                    </div>
                    
                    {/* AI Query Builder Panel */}
                    {showAiPanel && (
                        <div className="p-3 bg-[#1e1e1e] border-b border-[var(--border)] flex gap-2 items-center">
                            <Wand2 size={14} className="text-[var(--accent)] shrink-0" />
                            <input
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Describe your query (e.g., 'Find all users from USA with their orders')"
                                className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
                            />
                            <button
                                onClick={handleAiQuery}
                                disabled={isAiLoading || !aiPrompt}
                                className="bg-[var(--accent)] text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                            >
                                {isAiLoading ? "Generating..." : "Generate"}
                            </button>
                            {completion && (
                                <button
                                    onClick={applyAiQuery}
                                    className="bg-green-600/20 text-green-500 border border-green-600/30 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600/30"
                                >
                                    Apply
                                </button>
                            )}
                        </div>
                    )}
                    
                    {completion && showAiPanel && (
                        <div className="px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)] text-xs font-mono text-[var(--text-secondary)]">
                            <strong className="text-[var(--accent)]">AI Suggestion:</strong> {completion.replace(/```sql/g, '').replace(/```/g, '').trim()}
                        </div>
                    )}
                    
                    <div className="flex-1">
                        <MonacoEditor
                            height="100%"
                            language="sql"
                            value={sql}
                            onChange={(v) => setSql(v ?? "")}
                            theme={editorTheme}
                            options={{ fontSize, minimap: { enabled: false }, wordWrap: "on", scrollBeyondLastLine: false, padding: { top: 8 }, lineNumbers: "off" }}
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
                        <span className="text-xs text-[var(--text-muted)]">
                            {error ? "Error" : results.length > 0 ? `${results.length} rows` : "Results"}
                            {execTime !== null && !error && <span className="ml-2 text-[var(--success)]">({execTime.toFixed(1)}ms)</span>}
                        </span>
                        <div className="flex-1" />
                        {results.length > 0 && (
                            <>
                                <button onClick={exportCSV} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                    <Download size={12} /> CSV
                                </button>
                                <button onClick={() => { setResults([]); setColumns([]); }} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
                                    <Trash2 size={12} /> Clear
                                </button>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="m-4 p-3 rounded-xl text-sm font-mono" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "var(--danger)" }}>
                            {error}
                        </div>
                    )}

                    {!error && results.length > 0 && columns.length > 0 && (
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-[var(--bg-surface)]">
                                    <tr>
                                        {columns.map((col) => (
                                            <th key={col} className="px-4 py-2.5 text-left font-semibold text-[var(--text-muted)] border-b border-[var(--border)] whitespace-nowrap">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((row, i) => (
                                        <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
                                            {columns.map((col) => (
                                                <td key={col} className="px-4 py-2 text-[var(--text-secondary)] font-mono whitespace-nowrap">
                                                    {row[col] === null ? <span className="text-[var(--text-muted)] italic">NULL</span> : String(row[col])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {!error && results.length > 0 && columns.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-12 text-[var(--text-muted)]">
                            <Database size={32} strokeWidth={1} />
                            <span className="text-sm">Query executed but no column metadata returned</span>
                            <span className="text-xs">Try running a SELECT query with explicit column names</span>
                        </div>
                    )}

                    {!error && results.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center gap-3 py-12 text-[var(--text-muted)]">
                            <Database size={32} strokeWidth={1} />
                            <span className="text-sm">Run a query to see results</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
