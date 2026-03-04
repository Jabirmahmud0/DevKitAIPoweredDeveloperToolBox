// Tool registry — single source of truth for all tools
import {
    Code2,
    Database,
    FlaskConical,
    Braces,
    Play,
    Palette,
    FileText,
    Lock,
    Globe,
    TreePine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToolId } from "@/lib/stores/useToolStore";

export interface ToolMeta {
    id: ToolId;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
    description: string;
    tech: string[];
    color: string;
}

export const TOOLS: ToolMeta[] = [
    {
        id: "code-reviewer",
        label: "AI Code Reviewer",
        shortLabel: "Code Review",
        icon: Code2,
        description: "Paste code for expert AI review with fix suggestions",
        tech: ["Gemini", "Monaco", "Streaming"],
        color: "#7c6af5",
    },
    {
        id: "sql-playground",
        label: "SQL Playground",
        shortLabel: "SQL",
        icon: Database,
        description: "Write SQL against an in-browser SQLite database",
        tech: ["WASM", "Monaco", "Workers"],
        color: "#f59e0b",
    },
    {
        id: "regex-lab",
        label: "Regex Lab",
        shortLabel: "Regex",
        icon: FlaskConical,
        description: "Build, test, and explain regular expressions in real-time",
        tech: ["Workers", "Comlink", "XRegExp"],
        color: "#22d3a7",
    },
    {
        id: "json-toolkit",
        label: "JSON Toolkit",
        shortLabel: "JSON",
        icon: Braces,
        description: "Format, validate, diff, and query JSON with JMESPath",
        tech: ["jsdiff", "jmespath", "Monaco"],
        color: "#38bdf8",
    },
    {
        id: "code-runner",
        label: "Code Runner",
        shortLabel: "Runner",
        icon: Play,
        description: "Execute code in 10+ languages directly in the browser",
        tech: ["Judge0", "Monaco", "Streaming"],
        color: "#f43f5e",
    },
    {
        id: "color-studio",
        label: "AI Color Studio",
        shortLabel: "Colors",
        icon: Palette,
        description: "Generate, explore, and export design-ready color palettes",
        tech: ["chroma.js", "culori", "Gemini"],
        color: "#ec4899",
    },
    {
        id: "markdown-studio",
        label: "Markdown Studio",
        shortLabel: "Markdown",
        icon: FileText,
        description: "Full-featured Markdown editor with live preview and AI assist",
        tech: ["react-markdown", "Monaco", "Mermaid"],
        color: "#a3e635",
    },
    {
        id: "crypto-toolkit",
        label: "Crypto Toolkit",
        shortLabel: "Crypto",
        icon: Lock,
        description: "Hash, encode, encrypt, and generate tokens—all client-side",
        tech: ["Web Crypto", "WASM", "jose"],
        color: "#fb923c",
    },
    {
        id: "api-tester",
        label: "API Tester",
        shortLabel: "API",
        icon: Globe,
        description: "Lightweight HTTP client—a mini Postman in the browser",
        tech: ["axios", "Zustand", "Charts"],
        color: "#34d399",
    },
    {
        id: "ast-explorer",
        label: "AST Explorer",
        shortLabel: "AST",
        icon: TreePine,
        description: "Visualize Abstract Syntax Trees of JS/TS code",
        tech: ["@babel/parser", "D3", "Monaco"],
        color: "#c084fc",
    },
];

export const TOOL_MAP = Object.fromEntries(
    TOOLS.map((t) => [t.id, t])
) as Record<ToolId, ToolMeta>;
