"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, History, Command as CommandIcon } from "lucide-react";
import { TabBar } from "@/components/shell/TabBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { HistoryPanel } from "@/components/shell/HistoryPanel";
import { SettingsModal } from "@/components/shell/SettingsModal";
import { useToolStore } from "@/lib/stores/useToolStore";
import { TOOL_MAP } from "@/lib/tools";

// Lazy-load all tool components
const CodeReviewer = dynamic(() => import("@/components/tools/CodeReviewer"), { ssr: false });
const SqlPlayground = dynamic(() => import("@/components/tools/SqlPlayground"), { ssr: false });
const RegexLab = dynamic(() => import("@/components/tools/RegexLab"), { ssr: false });
const JsonToolkit = dynamic(() => import("@/components/tools/JsonToolkit"), { ssr: false });
const CodeRunner = dynamic(() => import("@/components/tools/CodeRunner"), { ssr: false });
const ColorStudio = dynamic(() => import("@/components/tools/ColorStudio"), { ssr: false });
const MarkdownStudio = dynamic(() => import("@/components/tools/MarkdownStudio"), { ssr: false });
const CryptoToolkit = dynamic(() => import("@/components/tools/CryptoToolkit"), { ssr: false });
const ApiTester = dynamic(() => import("@/components/tools/ApiTester"), { ssr: false });
const AstExplorer = dynamic(() => import("@/components/tools/AstExplorer"), { ssr: false });

function ToolSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="skeleton h-8 w-1/3 rounded-lg" />
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="skeleton h-64 w-full rounded-xl mt-6" />
      <div className="flex gap-3">
        <div className="skeleton h-10 w-32 rounded-lg" />
        <div className="skeleton h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "code-reviewer": CodeReviewer,
  "sql-playground": SqlPlayground,
  "regex-lab": RegexLab,
  "json-toolkit": JsonToolkit,
  "code-runner": CodeRunner,
  "color-studio": ColorStudio,
  "markdown-studio": MarkdownStudio,
  "crypto-toolkit": CryptoToolkit,
  "api-tester": ApiTester,
  "ast-explorer": AstExplorer,
};

export default function DevKitPage() {
  const { activeToolId } = useToolStore();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tool = TOOL_MAP[activeToolId];
  const ActiveTool = TOOL_COMPONENTS[activeToolId];

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #38bdf8 100%)",
                boxShadow: "0 2px 8px var(--accent-glow)",
              }}
            >
              DK
            </div>
            <span className="font-semibold text-[var(--text-primary)] text-sm hidden sm:block">DevKit</span>
            <span className="text-[var(--text-muted)] text-xs hidden sm:block">AI Toolbox</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
                window.dispatchEvent(ev);
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
            >
              <CommandIcon size={12} />
              <span>⌘K</span>
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
              title="History"
            >
              <History size={14} />
              <span className="hidden sm:block">History</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
              title="Settings"
            >
              <Settings size={14} />
              <span className="hidden sm:block">Settings</span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar />
      </header>

      {/* Main Tool Area */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeToolId}
            className="absolute inset-0 flex flex-col overflow-auto"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* Tool header bar */}
            <div
              className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
              style={{ borderColor: `${tool.color}20` }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: `${tool.color}20`, color: tool.color }}
              >
                <tool.icon size={14} />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[var(--text-primary)]">{tool.label}</h1>
                <p className="text-xs text-[var(--text-muted)] hidden sm:block">{tool.description}</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                {tool.tech.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${tool.color}15`, color: tool.color }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Tool content */}
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<ToolSkeleton />}>
                {ActiveTool && <ActiveTool />}
              </Suspense>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Overlays */}
      <CommandPalette />
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
