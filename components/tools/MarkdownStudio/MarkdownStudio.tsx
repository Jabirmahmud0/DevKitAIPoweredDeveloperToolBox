"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useCompletion } from "ai/react";
import { 
    Download, FileText, Split, PenLine, RefreshCw, Maximize2, Minimize2, Settings2,
    Copy, Check, FileCode, FileJson, FileDown, List, Bold, Italic, Code, Heading,
    Link as LinkIcon, AlertTriangle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div className="skeleton w-full h-full" />,
});

const MermaidChart = dynamic(() => import("./MermaidChart"), {
    ssr: false,
    loading: () => <div className="skeleton w-full h-64 rounded-lg" />,
});

const DEFAULT_MD = `# DevKit Markdown Studio

Welcome to the **Markdown Studio**! This is a fully-featured, side-by-side Markdown editor.

## Features

- **Live Preview:** See your changes instantly.
- **GitHub Flavored Markdown:** Tables, task lists, and more.
- **Syntax Highlighting:** Over 50+ languages supported out of the box.
- **AI Assistant:** Generate new sections or improve existing text automatically.
- **Math Support:** LaTeX equations with $...$ and $$...$$
- **Mermaid Diagrams:** Architecture and flow diagrams

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("Developer"));
\`\`\`

### Math Example

Inline math: $E = mc^2$

Display math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Deploy]
\`\`\`

### Task List
- [x] Create React app
- [ ] Add Framer Motion
- [ ] Write documentation

### Escaped Characters

To show literal characters: \\*not italic\\*, \\\`not code\\\`, \\# not heading

### Table Example

| Feature | Status | Priority |
|---------|--------|----------|
| Core    | Done   | High     |
| UI      | In Progress | Medium |
| Tests   | Pending | Low |

### Footnotes

Here's a sentence with a footnote.[^1]

[^1]: This is the footnote content.
`;

// Custom code block component with copy button
const CodeBlock = ({ 
    node, 
    inline, 
    className, 
    children, 
    ...props 
}: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const isMermaid = match && match[1] === "mermaid";
    
    if (!inline && match && isMermaid) {
        const code = String(children).replace(/\n$/, "");
        return <MermaidChart chart={code} />;
    }
    
    if (!inline && match) {
        const code = String(children).replace(/\n$/, "");
        
        return (
            <div className="relative group my-4 rounded-lg overflow-hidden border border-[var(--border)]">
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)]">
                    <span className="text-xs font-mono text-[var(--text-muted)]">{match[1]}</span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(code);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[var(--bg-elevated)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
                <pre className="overflow-x-auto">
                    <code className={className} {...props}>
                        {children}
                    </code>
                </pre>
            </div>
        );
    }
    
    return (
        <code className={className} {...props}>
            {children}
        </code>
    );
};

// Custom link component for autolink
const Link = ({ node, href, children, ...props }: any) => {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2"
            {...props}
        >
            {children}
        </a>
    );
};

// Custom table component with horizontal scroll
const Table = ({ node, children, ...props }: any) => {
    return (
        <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse" {...props}>
                {children}
            </table>
        </div>
    );
};

// Custom heading components with IDs for TOC
const HeadingComponent = ({ node, children, level, ...props }: any) => {
    const id = String(children).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
    const sizeClasses = {
        1: "text-2xl font-bold mb-4 mt-6",
        2: "text-xl font-bold mb-3 mt-5",
        3: "text-lg font-semibold mb-2 mt-4",
        4: "text-base font-semibold mb-2 mt-3",
        5: "text-sm font-medium mb-1 mt-2",
        6: "text-sm font-medium mb-1 mt-2",
    };
    
    return (
        <Tag 
            id={id} 
            className={`${sizeClasses[level as keyof typeof sizeClasses]} scroll-mt-20`}
            {...props}
        >
            {children}
        </Tag>
    );
};

export default function MarkdownStudio() {
    const { globalModel, fontSize, editorTheme } = useToolStore();
    const [markdown, setMarkdown] = useState(DEFAULT_MD);
    const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
    const [hljsTheme, setHljsTheme] = useState<"dark" | "light">("dark");
    const [showToc, setShowToc] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lintErrors, setLintErrors] = useState<Array<{ line: number; message: string; severity: "error" | "warning" }>>([]);
    const [showLint, setShowLint] = useState(false);

    // AI State
    const [aiAction, setAiAction] = useState<"improve" | "expand">("improve");
    const [aiPrompt, setAiPrompt] = useState("");
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const aiActionRef = useRef(aiAction);

    // Keep ref in sync with state
    useEffect(() => {
        aiActionRef.current = aiAction;
    }, [aiAction]);

    const { complete, completion, isLoading } = useCompletion({
        api: "/api/ai/markdown",
        onError: (error) => {
            console.error("[Markdown AI] Error:", error);
            setAiError(error.message || "Failed to generate content");
        },
        onFinish: (prompt, result) => {
            console.log("[Markdown AI] Finished:", { action: aiActionRef.current, resultLength: result.length });
            if (aiActionRef.current === "expand") {
                setMarkdown((prev) => prev + "\n\n" + result);
                setAiPrompt(""); // Clear the prompt after successful generation
            }
            setAiError(null);
        }
    });

    const handleAI = useCallback(() => {
        setAiError(null);
        console.log("[Markdown AI] Starting AI request:", { action: aiAction, prompt: aiPrompt, hasContent: !!markdown });
        if (aiAction === "improve") {
            complete("", { body: { action: "improve", content: markdown, model: globalModel } });
        } else {
            complete("", { body: { action: "expand", content: aiPrompt, context: markdown, model: globalModel } });
        }
    }, [aiAction, aiPrompt, markdown, globalModel, complete]);

    const replaceWithImprovement = () => {
        if (completion) {
            setMarkdown(completion);
            setShowAiPanel(false);
            setAiError(null);
        }
    };

    // Markdown linting
    useEffect(() => {
        const errors: Array<{ line: number; message: string; severity: "error" | "warning" }> = [];
        const lines = markdown.split("\n");
        
        lines.forEach((line, idx) => {
            // Check for multiple consecutive blank lines
            if (line.trim() === "" && lines[idx + 1]?.trim() === "" && lines[idx + 2]?.trim() === "") {
                errors.push({ line: idx + 1, message: "Multiple consecutive blank lines", severity: "warning" });
            }
            
            // Check for lines that are too long
            if (line.length > 120 && !line.startsWith("```")) {
                errors.push({ line: idx + 1, message: `Line exceeds 120 characters (${line.length})`, severity: "warning" });
            }
            
            // Check for missing space after heading
            if (/^#{1,6}[^#\s]/.test(line)) {
                errors.push({ line: idx + 1, message: "Missing space after heading marker", severity: "error" });
            }
            
            // Check for trailing whitespace
            if (/\s+$/.test(line)) {
                errors.push({ line: idx + 1, message: "Trailing whitespace", severity: "warning" });
            }
        });
        
        setLintErrors(errors);
    }, [markdown]);

    // Generate TOC
    const toc = useMemo(() => {
        const headings: Array<{ level: number; text: string; id: string }> = [];
        const lines = markdown.split("\n");
        
        lines.forEach((line) => {
            const match = /^(#{1,6})\s+(.+)$/.exec(line);
            if (match) {
                const level = match[1].length;
                const text = match[2];
                const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                headings.push({ level, text, id });
            }
        });
        
        return headings;
    }, [markdown]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                e.preventDefault();
                switch (e.key.toLowerCase()) {
                    case "b":
                        insertFormatting("**");
                        break;
                    case "i":
                        insertFormatting("*");
                        break;
                    case "k":
                        insertFormatting("[", "]()");
                        break;
                    case "c":
                        insertFormatting("`", "`");
                        break;
                    case "h":
                        insertFormatting("# ");
                        break;
                }
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const insertFormatting = (prefix: string, suffix: string = "") => {
        const textarea = document.querySelector("textarea");
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = markdown.substring(start, end);
        const newMarkdown = 
            markdown.substring(0, start) + 
            prefix + 
            selectedText + 
            suffix + 
            markdown.substring(end);
        
        setMarkdown(newMarkdown);
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

    const downloadHtml = () => {
        // Simple HTML export (could be enhanced with full HTML document structure)
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #1e1e1e; padding: 16px; border-radius: 8px; overflow-x: auto; }
        code { background: #1e1e1e; padding: 2px 6px; border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #333; padding: 8px 12px; }
        th { background: #2a2a2a; }
    </style>
</head>
<body>
${markdown}
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `document-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadPdf = () => {
        // Using html2pdf which is already installed
        import("html2pdf.js").then((html2pdf) => {
            const element = document.querySelector(".markdown-preview-content") as HTMLElement;
            if (element) {
                html2pdf.default().from(element).save(`document-${Date.now()}.pdf`);
            }
        });
    };

    const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    const chars = markdown.length;

    // Toggle HLJS theme
    useEffect(() => {
        const link = document.getElementById("hljs-theme") as HTMLLinkElement;
        if (link) {
            link.href = hljsTheme === "dark" 
                ? "https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github-dark.css"
                : "https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github.css";
        }
    }, [hljsTheme]);

    return (
        <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[var(--bg-base)]' : ''} bg-[var(--bg-default)]`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* View Mode */}
                    <div className="flex bg-[var(--bg-surface)] rounded-md border border-[var(--border)] p-0.5">
                        <button
                            onClick={() => setViewMode("edit")}
                            className={`p-1.5 rounded flex items-center justify-center ${viewMode === 'edit' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Edit Only (Ctrl+1)"
                        >
                            <PenLine size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode("split")}
                            className={`p-1.5 rounded flex items-center justify-center ${viewMode === 'split' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Split View (Ctrl+2)"
                        >
                            <Split size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode("preview")}
                            className={`p-1.5 rounded flex items-center justify-center ${viewMode === 'preview' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Preview Only (Ctrl+3)"
                        >
                            <FileText size={14} />
                        </button>
                    </div>

                    {/* Formatting shortcuts */}
                    <div className="hidden lg:flex bg-[var(--bg-surface)] rounded-md border border-[var(--border)] p-0.5">
                        <button onClick={() => insertFormatting("**")} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" title="Bold (Ctrl+Shift+B)">
                            <Bold size={14} />
                        </button>
                        <button onClick={() => insertFormatting("*")} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" title="Italic (Ctrl+Shift+I)">
                            <Italic size={14} />
                        </button>
                        <button onClick={() => insertFormatting("`", "`")} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" title="Code (Ctrl+Shift+C)">
                            <Code size={14} />
                        </button>
                        <button onClick={() => insertFormatting("# ")} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" title="Heading (Ctrl+Shift+H)">
                            <Heading size={14} />
                        </button>
                        <button onClick={() => insertFormatting("[", "]()")} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" title="Link (Ctrl+Shift+K)">
                            <LinkIcon size={14} />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-[var(--border)] mx-1" />

                    {/* TOC Toggle */}
                    <button
                        onClick={() => setShowToc(!showToc)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showToc ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                        <List size={14} /> TOC
                    </button>

                    {/* Lint Toggle */}
                    <button
                        onClick={() => setShowLint(!showLint)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors relative ${showLint ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                        <AlertTriangle size={14} /> Lint
                        {lintErrors.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--danger)] rounded-full text-[10px] flex items-center justify-center">
                                {lintErrors.length}
                            </span>
                        )}
                    </button>

                    {/* AI Panel */}
                    <button
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showAiPanel ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                        <Settings2 size={14} /> AI
                    </button>

                    {/* Theme toggle */}
                    <select
                        value={hljsTheme}
                        onChange={(e) => setHljsTheme(e.target.value as "dark" | "light")}
                        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        title="Syntax Highlighting Theme"
                    >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
                    <span className="hidden sm:inline-block">{words} words</span>
                    <span className="hidden sm:inline-block">{readTime} min</span>
                    <span className="hidden md:inline-block">{chars} chars</span>
                    
                    {/* Export dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            <Download size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[120px]">
                            <button onClick={downloadMd} className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-surface)] flex items-center gap-2">
                                <FileText size={14} /> Markdown
                            </button>
                            <button onClick={downloadHtml} className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-surface)] flex items-center gap-2">
                                <FileCode size={14} /> HTML
                            </button>
                            <button onClick={downloadPdf} className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-surface)] flex items-center gap-2">
                                <FileJson size={14} /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Fullscreen toggle */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Lint Panel */}
            {showLint && lintErrors.length > 0 && (
                <div className="bg-[var(--bg-surface)] border-b border-[var(--border)] p-2 shrink-0 max-h-32 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        {lintErrors.slice(0, 10).map((error, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className={`w-2 h-2 rounded-full ${error.severity === 'error' ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'}`} />
                                <span className="font-mono text-[var(--text-muted)]">Line {error.line}:</span>
                                <span className="text-[var(--text-secondary)]">{error.message}</span>
                            </div>
                        ))}
                        {lintErrors.length > 10 && (
                            <div className="text-xs text-[var(--text-muted)] italic">+{lintErrors.length - 10} more issues</div>
                        )}
                    </div>
                </div>
            )}

            {/* AI Panel */}
            {showAiPanel && (
                <div className="bg-[#1e1e1e] border-b border-[var(--border)] p-4 shrink-0 shadow-inner">
                    <div className="flex flex-col gap-3 max-w-3xl">
                        {aiError && (
                            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md p-3 text-sm text-[var(--danger)]">
                                {aiError}
                            </div>
                        )}
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
                                    value={aiPrompt || ""}
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
                                 {isLoading ? "Generating..." : (aiAction === "improve" ? "Improve Text" : "Generate")}
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

                        {completion && aiAction === "expand" && (
                            <div className="mt-2 bg-green-600/10 border border-green-600/30 rounded-md p-3">
                                <p className="text-xs text-green-500 font-semibold">✓ Section added to your document!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                {/* TOC Sidebar */}
                {showToc && toc.length > 0 && (
                    <div className="w-48 bg-[var(--bg-surface)] border-r border-[var(--border)] overflow-y-auto shrink-0 hidden lg:block">
                        <div className="p-3 text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            Table of Contents
                        </div>
                        <nav className="p-2">
                            {toc.map((heading, idx) => (
                                <a
                                    key={idx}
                                    href={`#${heading.id}`}
                                    className="block py-1 px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded transition-colors"
                                    style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const element = document.getElementById(heading.id);
                                        element?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                >
                                    {heading.text}
                                </a>
                            ))}
                        </nav>
                    </div>
                )}

                {/* Editor */}
                {(viewMode === "split" || viewMode === "edit") && (
                    <div className={`flex flex-col border-[var(--border)] relative ${viewMode === 'split' ? 'flex-1' : 'w-full'}`}>
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
                                    padding: { top: 16, bottom: 16 },
                                    quickSuggestions: { comments: true, strings: true, other: true }
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Preview */}
                {(viewMode === "split" || viewMode === "preview") && (
                    <div className={`flex flex-col relative ${hljsTheme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'} ${viewMode === 'split' ? 'flex-1' : 'w-full'}`}>
                         <div className={`absolute top-0 right-0 z-10 px-3 py-1 text-[10px] font-mono rounded-bl-lg ${hljsTheme === 'dark' ? 'bg-[#ffffff10] text-[var(--text-muted)]' : 'bg-[#00000010] text-gray-500'}`}>Preview</div>
                         <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                             <div className={`prose max-w-none markdown-preview-content ${hljsTheme === 'dark' ? 'prose-invert text-[var(--text-primary)]' : 'text-gray-900'}`}>
                                <style jsx global>{`
                                    .markdown-preview-content {
                                        --tw-prose-body: ${hljsTheme === 'dark' ? 'var(--text-primary)' : '#374151'};
                                        --tw-prose-headings: ${hljsTheme === 'dark' ? 'var(--text-primary)' : '#111827'};
                                        --tw-prose-bold: ${hljsTheme === 'dark' ? 'var(--text-primary)' : '#111827'};
                                        --tw-prose-code: ${hljsTheme === 'dark' ? 'var(--text-primary)' : '#111827'};
                                        --tw-prose-links: var(--accent);
                                        --tw-prose-counters: ${hljsTheme === 'dark' ? 'var(--text-muted)' : '#6b7280'};
                                        --tw-prose-bullets: ${hljsTheme === 'dark' ? 'var(--border)' : '#d1d5db'};
                                        --tw-prose-hr: ${hljsTheme === 'dark' ? 'var(--border)' : '#e5e7eb'};
                                        --tw-prose-th-borders: ${hljsTheme === 'dark' ? 'var(--border)' : '#d1d5db'};
                                        --tw-prose-td-borders: ${hljsTheme === 'dark' ? 'var(--border)' : '#e5e7eb'};
                                        --tw-prose-pre-bg: ${hljsTheme === 'dark' ? 'var(--bg-surface)' : '#1f2937'};
                                        --tw-prose-pre-code: ${hljsTheme === 'dark' ? 'var(--text-primary)' : '#f3f4f6'};
                                    }
                                    .markdown-preview-content table {
                                        display: block;
                                        overflow-x: auto;
                                        white-space: nowrap;
                                    }
                                    .markdown-preview-content pre {
                                        overflow-x: auto;
                                        max-width: 100%;
                                    }
                                    .markdown-preview-content code {
                                        word-wrap: break-word;
                                        overflow-wrap: break-word;
                                    }
                                    .markdown-preview-content a {
                                        word-break: break-all;
                                    }
                                    .katex {
                                        font-size: 1.1em;
                                    }
                                    .katex-display {
                                        overflow-x: auto;
                                        overflow-y: hidden;
                                        padding: 0.5em 0;
                                    }
                                `}</style>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex, rehypeSanitize, rehypeHighlight]}
                                    components={{
                                        code: CodeBlock,
                                        a: Link,
                                        table: Table,
                                        h1: (props) => <HeadingComponent {...props} level={1} />,
                                        h2: (props) => <HeadingComponent {...props} level={2} />,
                                        h3: (props) => <HeadingComponent {...props} level={3} />,
                                        h4: (props) => <HeadingComponent {...props} level={4} />,
                                        h5: (props) => <HeadingComponent {...props} level={5} />,
                                        h6: (props) => <HeadingComponent {...props} level={6} />,
                                    }}
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
