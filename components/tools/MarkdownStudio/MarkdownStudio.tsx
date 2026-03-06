"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useCompletion } from "ai/react";
import { Download, FileText, Split, PenLine, RefreshCw, Maximize2, Minimize2, Settings2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css"; // We'll rely on global token styles, but this is a base

import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div className="skeleton w-full h-full" />,
});

const DEFAULT_MD = `# DevKit Markdown Studio

Welcome to the **Markdown Studio**! This is a fully-featured, side-by-side Markdown editor.

## Features

- **Live Preview:** See your changes instantly.
- **GitHub Flavored Markdown:** Tables, task lists, and more.
- **Syntax Highlighting:** Over 50+ languages supported out of the box.
- **AI Assistant:** Generate new sections or improve existing text automatically.

### Code Example

\\\`\\\`\\\`javascript
function greet(name) {
  return \\\`Hello, \${name}!\\\`;
}
console.log(greet("Developer"));
\\\`\\\`\\\`

### Task List
- [x] Create React app
- [ ] Add Framer Motion
- [ ] Write documentation
`;

export default function MarkdownStudio() {
    const { globalModel, fontSize, editorTheme } = useToolStore();
    const [markdown, setMarkdown] = useState(DEFAULT_MD);
    const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
    
    // AI State
    const [aiAction, setAiAction] = useState<"improve" | "expand">("improve");
    const [aiPrompt, setAiPrompt] = useState("");
    const [showAiPanel, setShowAiPanel] = useState(false);

    const { complete, completion, isLoading } = useCompletion({ 
        api: "/api/ai/markdown",
        onFinish: (prompt, result) => {
            if (aiAction === "expand") {
                setMarkdown((prev) => prev + "\n\n" + result);
            }
        }
    });

    const handleAI = useCallback(() => {
        if (aiAction === "improve") {
            complete("", { body: { action: "improve", content: markdown, model: globalModel } });
        } else {
            complete("", { body: { action: "expand", content: aiPrompt, context: markdown, model: globalModel } });
        }
    }, [aiAction, aiPrompt, markdown, globalModel, complete]);

    // Replace markdown with AI improvement if requested
    const replaceWithImprovement = () => {
        if (completion) {
            setMarkdown(completion);
            setShowAiPanel(false);
        }
    };

    const downloadMd = () => {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `document-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Simple word count
    const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    return (
        <div className="flex flex-col h-full bg-[var(--bg-default)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex bg-[var(--bg-surface)] rounded-md border border-[var(--border)] p-0.5">
                        <button
                            onClick={() => setViewMode("edit")}
                            className={`p-1.5 rounded flex items-center justify-center ${viewMode === 'edit' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Edit Only"
                        >
                            <PenLine size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode("split")}
                            className={`p-1.5 rounded flex items-center justify-center ${viewMode === 'split' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Split View"
                        >
                            <Split size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode("preview")}
                            className={`p-1.5 rounded flex items-center justify-center ${viewMode === 'preview' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Preview Only"
                        >
                            <FileText size={14} />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-[var(--border)] mx-1" />

                    <button
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showAiPanel ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                        <Settings2 size={14} /> AI Assistant
                    </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
                    <span className="hidden sm:inline-block">{words} words</span>
                    <span className="hidden sm:inline-block">{readTime} min read</span>
                    <button
                        onClick={downloadMd}
                        className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Download Markdown"
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>

            {/* AI Panel (Collapsible) */}
            {showAiPanel && (
                <div className="bg-[#1e1e1e] border-b border-[var(--border)] p-4 shrink-0 shadow-inner">
                    <div className="flex flex-col gap-3 max-w-3xl">
                        <div className="flex gap-2">
                             <select 
                                value={aiAction} 
                                onChange={(e) => setAiAction(e.target.value as any)}
                                className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                             >
                                 <option value="improve">Improve Overall Document</option>
                                 <option value="expand">Generate New Section</option>
                             </select>
                             
                             {aiAction === "expand" && (
                                 <input 
                                    className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs focus:border-[var(--accent)] outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    placeholder="e.g. 'Installation Guide' or 'API Reference'"
                                     onKeyDown={e => e.key === "Enter" && handleAI()}
                                 />
                             )}
                             
                             <button
                                onClick={handleAI}
                                disabled={isLoading || (aiAction === "expand" && !aiPrompt)}
                                className="bg-[var(--accent)] text-white px-4 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                             >
                                 {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Settings2 size={14} />}
                                 {aiAction === "improve" ? "Improve Text" : "Generate"}
                             </button>
                        </div>

                        {completion && aiAction === "improve" && (
                            <div className="mt-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-3">
                                <p className="text-xs text-[var(--text-muted)] mb-2 font-semibold">Suggested Improvement:</p>
                                <div className="max-h-40 overflow-y-auto text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap mb-3 p-2 bg-[#111] rounded">
                                    {completion}
                                </div>
                                <button 
                                    onClick={replaceWithImprovement}
                                    className="bg-green-600/20 text-green-500 hover:bg-green-600/30 border border-green-600/30 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                >
                                    Apply Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Split View */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Editor */}
                {(viewMode === "split" || viewMode === "edit") && (
                    <div className={`flex flex-col border-[var(--border)] relative ${viewMode === 'split' ? 'flex-1 border-r' : 'w-full'}`}>
                        <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#00000040] text-[10px] font-mono text-[var(--text-muted)] rounded-bl-lg">Editor</div>
                        <div className="flex-1 overflow-hidden">
                             <MonacoEditor
                                language="markdown"
                                value={markdown}
                                onChange={(v) => setMarkdown(v ?? "")}
                                theme={editorTheme}
                                options={{
                                    fontSize,
                                    minimap: { enabled: false },
                                    wordWrap: "on",
                                    lineNumbers: "off",
                                    padding: { top: 16, bottom: 16 }
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Preview */}
                {(viewMode === "split" || viewMode === "preview") && (
                    <div className={`flex flex-col relative bg-[#0d1117] ${viewMode === 'split' ? 'flex-1' : 'w-full'}`}>
                         <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#ffffff10] text-[10px] font-mono text-[var(--text-muted)] rounded-bl-lg">Preview</div>
                         <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                             <div className="prose prose-invert max-w-none text-[var(--text-primary)]">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                                >
                                    {markdown}
                                </ReactMarkdown>
                             </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}
