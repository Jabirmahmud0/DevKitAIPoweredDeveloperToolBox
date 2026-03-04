"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { parse } from "@babel/parser";
import { GitMerge, Map, Wand2, MonitorPlay, AlertTriangle } from "lucide-react";
import { useCompletion } from "ai/react";
import { useToolStore } from "@/lib/stores/useToolStore";

// Dynamically import Tree to avoid SSR issues with d3
const Tree = dynamic(() => import("react-d3-tree"), { ssr: false });
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Helper to format Babel AST for react-d3-tree
function mapAstToTree(node: any, name = "Program"): any {
    if (!node || typeof node !== "object") return null;

    const children: any[] = [];

    // Extract meaningful properties to show in the tree node's attributes
    const attributes: Record<string, string> = {};
    if (node.type) attributes.type = node.type;
    if (node.name) attributes.name = node.name;
    if (node.value !== undefined) attributes.value = String(node.value);
    if (node.operator) attributes.operator = node.operator;

    // Recurse into common AST arrays or objects
    for (const key in node) {
        if (["type", "start", "end", "loc", "comments", "errors"].includes(key)) continue;

        const child = node[key];
        if (Array.isArray(child)) {
            child.forEach((c, idx) => {
                const mapped = mapAstToTree(c, `${key}[${idx}]`);
                if (mapped) children.push(mapped);
            });
        } else if (child && typeof child === "object" && child.type) {
            const mapped = mapAstToTree(child, key);
            if (mapped) children.push(mapped);
        }
    }

    return {
        name: node.type || name,
        attributes,
        children: children.length > 0 ? children : undefined,
        _rawNode: node // keep reference for AI explain
    };
}

export default function AstExplorer() {
    const { fontSize, editorTheme, globalModel } = useToolStore();
    const [code, setCode] = useState("function greet(name) {\n  return `Hello, ${name}!`;\n}");
    const [ast, setAst] = useState<any>(null);
    const [treeData, setTreeData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    const { complete, completion, isLoading: aiLoading, setCompletion } = useCompletion({
        api: "/api/ai/ast"
    });

    // Parse code whenever it changes
    useEffect(() => {
        try {
            setError(null);
            const parsed = parse(code, {
                sourceType: "module",
                plugins: ["typescript", "jsx"],
                errorRecovery: true,
                attachComment: false,
            });
            setAst(parsed);

            const td = mapAstToTree(parsed.program);
            setTreeData(td);
        } catch (err: any) {
            setError(err.message || "Failed to parse code.");
            setAst(null);
            setTreeData(null);
        }
    }, [code]);

    const handleNodeClick = (nodeDatum: any) => {
        setCompletion(""); // clear past AI explanations
        if (nodeDatum.data && nodeDatum.data._rawNode) {
            setSelectedNode(nodeDatum.data._rawNode);
        }
    };

    const explainSelectedNode = () => {
        if (!selectedNode || !code) return;

        // Extract the snippet
        const { start, end } = selectedNode;
        let snippet = "";
        if (typeof start === "number" && typeof end === "number") {
            snippet = code.substring(start, end);
        }

        complete("", {
            body: {
                codeSnippet: snippet,
                nodeJson: JSON.stringify(selectedNode, (k, v) => ["start", "end", "loc"].includes(k) ? undefined : v, 2),
                model: globalModel
            }
        });
    };

    // Prepare JSON view for the inspected node
    const inspectedNodeJson = selectedNode
        ? JSON.stringify(selectedNode, (key, value) => {
            if (key === "loc" || key === "_rawNode" || key === "start" || key === "end") return undefined;
            return value;
        }, 2)
        : "";

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            {/* Topbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2 font-semibold text-sm text-[var(--accent)]">
                    <Map size={16} /> AST Explorer
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-xs font-semibold bg-red-500/10 px-3 py-1 rounded-full">
                        <AlertTriangle size={14} /> Parse Error
                    </div>
                )}
            </div>

            <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
                {/* Left Panel: Code & Inspector */}
                <div className="w-full lg:w-1/3 flex flex-col border-r border-[var(--border)] flex-shrink-0 min-h-[400px]">
                    {/* Code Editor */}
                    <div className="h-1/2 flex flex-col relative border-b border-[var(--border)]">
                        <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#00000040] text-[10px] font-mono text-[var(--text-muted)] rounded-bl-lg">JavaScript / TypeScript</div>
                        <MonacoEditor
                            language="typescript"
                            value={code}
                            onChange={(v) => setCode(v ?? "")}
                            theme={editorTheme}
                            options={{ fontSize, minimap: { enabled: false } }}
                        />
                    </div>

                    {/* Node Inspector */}
                    <div className="h-1/2 flex flex-col bg-[#1e1e1e] relative">
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-surface)] border-b border-[#333] shrink-0">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Node Inspector</span>
                            {selectedNode && (
                                <button
                                    onClick={explainSelectedNode}
                                    disabled={aiLoading}
                                    className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:opacity-80 transition-opacity"
                                >
                                    {aiLoading ? <MonitorPlay size={14} className="animate-pulse" /> : <Wand2 size={14} />} AI Explain
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto relative">
                            {selectedNode ? (
                                <div className="flex flex-col h-full">
                                    {/* AI completion */}
                                    {completion && (
                                        <div className="p-3 bg-[var(--bg-elevated)] border-b border-[#333] text-xs font-sans text-[var(--text-secondary)] leading-relaxed border-l-2 border-l-[var(--accent)]">
                                            {completion}
                                        </div>
                                    )}
                                    {/* JSON viewer */}
                                    <div className="flex-1 relative">
                                        <MonacoEditor
                                            language="json"
                                            value={inspectedNodeJson}
                                            theme={editorTheme}
                                            options={{ fontSize, readOnly: true, minimap: { enabled: false } }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-sm italic font-mono p-4 text-center">
                                    Click a node in the tree<br />to inspect its properties.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Interactive Tree */}
                <div className="flex-1 bg-[var(--bg-surface)] relative overflow-hidden flex items-center justify-center">
                    {treeData ? (
                        <div className="w-full h-full">
                            <Tree
                                data={treeData}
                                orientation="vertical"
                                pathFunc="step"
                                translate={{ x: 300, y: 50 }}
                                onNodeClick={handleNodeClick}
                                nodeSize={{ x: 200, y: 100 }}
                                renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
                                    <g>
                                        <circle r="12" fill="var(--accent)" onClick={toggleNode} className="cursor-pointer hover:fill-blue-500" />
                                        <text fill="var(--text-primary)" strokeWidth="1" x="20" dy="5" fontSize="12px" fontFamily="monospace">
                                            {nodeDatum.name}
                                        </text>
                                        {nodeDatum.attributes?.name && (
                                            <text fill="var(--text-muted)" x="20" dy="20" fontSize="10px" fontFamily="monospace">
                                                name: {nodeDatum.attributes.name}
                                            </text>
                                        )}
                                        {nodeDatum.attributes?.value && (
                                            <text fill="var(--text-muted)" x="20" dy="20" fontSize="10px" fontFamily="monospace">
                                                value: {nodeDatum.attributes.value}
                                            </text>
                                        )}
                                    </g>
                                )}
                            />
                        </div>
                    ) : (
                        <div className="text-[var(--text-muted)] font-mono text-sm opacity-50 flex items-center gap-2">
                            {error ? "Tree building failed due to syntax error." : "Building tree..."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
