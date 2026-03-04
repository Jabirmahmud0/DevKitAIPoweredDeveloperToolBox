import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EditorTheme = "vs-dark" | "github-dark" | "monokai" | "solarized-dark";
export type AIModel = "gemini";
export type ToolId =
    | "code-reviewer"
    | "sql-playground"
    | "regex-lab"
    | "json-toolkit"
    | "code-runner"
    | "color-studio"
    | "markdown-studio"
    | "crypto-toolkit"
    | "api-tester"
    | "ast-explorer";

interface SettingsState {
    activeToolId: ToolId;
    globalModel: AIModel;
    fontSize: number;
    editorTheme: EditorTheme;
    // Actions
    setActiveTool: (id: ToolId) => void;
    setGlobalModel: (model: AIModel) => void;
    setFontSize: (size: number) => void;
    setEditorTheme: (theme: EditorTheme) => void;
}

export const useToolStore = create<SettingsState>()(
    persist(
        (set) => ({
            activeToolId: "code-reviewer",
            globalModel: "gemini",
            fontSize: 14,
            editorTheme: "vs-dark",
            setActiveTool: (id) => set({ activeToolId: id }),
            setGlobalModel: (model) => set({ globalModel: model }),
            setFontSize: (size) => set({ fontSize: size }),
            setEditorTheme: (theme) => set({ editorTheme: theme }),
        }),
        {
            name: "devkit-settings",
        }
    )
);
