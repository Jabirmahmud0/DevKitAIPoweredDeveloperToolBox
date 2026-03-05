"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Play, PlayCircle, Loader2, AlertCircle, Trash2, Wand2, ArrowRight } from "lucide-react";
import { useCompletion } from "ai/react";
import { useToolStore } from "@/lib/stores/useToolStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type LanguageInfo = {
    id: number;
    name: string;
    mode: string;
    defaultCode: string;
    templates?: Record<string, string>;
};

const TEMPLATES: Record<string, Record<string, string>> = {
    javascript: {
        "Hello World": 'console.log("Hello, World!");',
        "Fetch API": 'fetch("https://api.github.com/users/github")\n  .then(res => res.json())\n  .then(data => console.log(data));',
        "Async/Await": 'async function fetchData() {\n  const res = await fetch("https://api.example.com");\n  const data = await res.json();\n  return data;\n}',
        "Array Methods": 'const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconst sum = nums.reduce((a, b) => a + b, 0);\nconsole.log(doubled, sum);',
    },
    python: {
        "Hello World": 'print("Hello, World!")',
        "File I/O": 'with open("file.txt", "r") as f:\n    content = f.read()\n    print(content)',
        "List Comprehension": 'squares = [x**2 for x in range(10)]\nprint(squares)',
        "API Request": 'import requests\nresponse = requests.get("https://api.github.com")\nprint(response.json())',
    },
    typescript: {
        "Hello World": 'const greeting: string = "Hello, TypeScript!";\nconsole.log(greeting);',
        "Generic Function": 'function identity<T>(arg: T): T {\n  return arg;\n}\nconsole.log(identity<string>("Hello"));',
        "Interface": 'interface User {\n  id: number;\n  name: string;\n}\nconst user: User = { id: 1, name: "Dev" };',
    },
    java: {
        "Hello World": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}',
        "Stream API": 'import java.util.*;\nimport java.util.stream.*;\npublic class Main {\n    public static void main(String[] args) {\n        List<Integer> nums = Arrays.asList(1,2,3,4,5);\n        List<Integer> squared = nums.stream().map(n -> n*n).collect(Collectors.toList());\n        System.out.println(squared);\n    }\n}',
    },
    cpp: {
        "Hello World": '#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}',
        "Vector Example": '#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> nums = {1, 2, 3, 4, 5};\n    std::sort(nums.begin(), nums.end());\n    for (int n : nums) std::cout << n << " ";\n    return 0;\n}',
    },
    rust: {
        "Hello World": 'fn main() {\n    println!("Hello, Rust!");\n}',
        "Ownership": 'fn main() {\n    let s1 = String::from("hello");\n    let s2 = s1;\n    println!("{}", s2);\n}',
    },
    go: {
        "Hello World": 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}',
        "Goroutine": 'package main\n\nimport (\n    "fmt"\n    "time"\n)\n\nfunc sayHello() {\n    fmt.Println("Hello from goroutine!")\n}\n\nfunc main() {\n    go sayHello()\n    time.Sleep(time.Second)\n}',
    },
};

const LANGUAGES: Record<string, LanguageInfo> = {
    javascript: { id: 63, name: "Node.js (12.14.0)", mode: "javascript", defaultCode: 'console.log("Hello, World!");' },
    typescript: { id: 74, name: "TypeScript (3.7.4)", mode: "typescript", defaultCode: 'const greeting: string = "Hello, TypeScript!";\nconsole.log(greeting);' },
    python: { id: 71, name: "Python (3.8.1)", mode: "python", defaultCode: 'print("Hello, Python!")' },
    go: { id: 60, name: "Go (1.13.5)", mode: "go", defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}' },
    rust: { id: 73, name: "Rust (1.40.0)", mode: "rust", defaultCode: 'fn main() {\n    println!("Hello, Rust!");\n}' },
    java: { id: 62, name: "Java (13.0.1)", mode: "java", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}' },
    cpp: { id: 54, name: "C++ (GCC 9.2.0)", mode: "cpp", defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}' }
};

export default function CodeRunner() {
    const { fontSize, editorTheme, globalModel } = useToolStore();
    const [langKey, setLangKey] = useState<keyof typeof LANGUAGES>("javascript");
    const [code, setCode] = useState(LANGUAGES.javascript.defaultCode);
    const [stdin, setStdin] = useState("");
    const [stdout, setStdout] = useState("");
    const [stderr, setStderr] = useState("");
    const [compileError, setCompileError] = useState("");
    const [execTime, setExecTime] = useState("");
    const [memory, setMemory] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState("");

    // AI Debug
    const [showAi, setShowAi] = useState(false);
    const { complete: debugCode, completion: aiDebugResponse, isLoading: isAiLoading, setCompletion: setAiResponse } = useCompletion({
        api: "/api/ai/debug",
    });

    const handleLangChange = (newLang: keyof typeof LANGUAGES) => {
        setLangKey(newLang);
        setSelectedTemplate("");
        // Only override if they haven't written much code
        if (code.length < 50 || Object.values(LANGUAGES).some(l => l.defaultCode === code)) {
            setCode(LANGUAGES[newLang].defaultCode);
        }
    };

    const handleTemplateChange = (templateName: string) => {
        setSelectedTemplate(templateName);
        if (templateName && TEMPLATES[langKey]?.[templateName]) {
            setCode(TEMPLATES[langKey][templateName]);
        }
    };

    const runCode = async () => {
        setIsRunning(true);
        setStdout("");
        setStderr("");
        setCompileError("");
        setExecTime("");
        setMemory("");
        setAiResponse("");
        setShowAi(false);

        try {
            const res = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_code: code,
                    language_id: LANGUAGES[langKey].id,
                    stdin
                })
            });

            if (!res.ok) {
                const t = await res.text();
                setCompileError("Execution failed \n" + t);
                setIsRunning(false);
                return;
            }

            const data = await res.json();

            // Judge0 Response format (base64_encoded=false, so no decoding needed)
            if (data.stdout) setStdout(data.stdout);
            if (data.stderr) setStderr(data.stderr);
            if (data.compile_output) setCompileError(data.compile_output);

            if (data.time) setExecTime(`${data.time} s`);
            if (data.memory) setMemory(`${data.memory} KB`);
            
        } catch (err) {
            setCompileError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsRunning(false);
        }
    };

    const handleAiDebug = () => {
        setShowAi(true);
        debugCode("", { 
            body: { 
                 code, 
                 language: LANGUAGES[langKey].name, 
                 error: compileError || stderr, 
                 stdout,
                 model: globalModel
            } 
        });
    };

    const hasErrors = !!(stderr || compileError);

    return (
        <div className="flex flex-col lg:flex-row h-full">
            {/* Left: Editor & Controls */}
            <div className="flex-1 flex flex-col border-r border-[var(--border)] relative min-w-0">
                {/* Topbar */}
                <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] shrink-0 max-w-full overflow-x-auto">
                    <div className="flex items-center gap-3">
                        <select
                            value={langKey}
                            onChange={(e) => handleLangChange(e.target.value as keyof typeof LANGUAGES)}
                            className="bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[var(--accent)] font-semibold"
                        >
                            {Object.entries(LANGUAGES).map(([k, v]) => (
                                <option key={k} value={k}>{v.name}</option>
                            ))}
                        </select>
                        
                        {/* Template Selector */}
                        <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[var(--accent)] italic"
                        >
                            <option value="">Select a template...</option>
                            {TEMPLATES[langKey] && Object.keys(TEMPLATES[langKey]).map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        
                        <button
                            onClick={runCode}
                            disabled={isRunning || !code.trim()}
                            className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-5 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                        >
                            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                            Run Code
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full bg-[#1e1e1e] relative min-h-[300px]">
                    <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#00000040] text-[10px] font-mono text-[var(--text-muted)] rounded-bl-lg pointer-events-none">
                         {LANGUAGES[langKey].mode}
                    </div>
                    <MonacoEditor
                        language={LANGUAGES[langKey].mode}
                        value={code}
                        onChange={(v) => setCode(v ?? "")}
                        theme={editorTheme}
                        options={{
                            fontSize,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            padding: { top: 16 }
                        }}
                    />
                </div>
            </div>

            {/* Right Side / Mobile bottom: I/O & Terminal */}
            <div className="w-full lg:w-[40%] flex flex-col bg-[#111]">
                {/* STDIN Toggle */}
                <div className="h-1/4 border-b border-[var(--border)] flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)] shrink-0 border-b border-[var(--border)]">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Standard Input (stdin)</span>
                    </div>
                    <textarea
                        value={stdin}
                        onChange={e => setStdin(e.target.value)}
                        placeholder="Provide console input here..."
                        className="flex-1 w-full bg-transparent p-3 text-sm font-mono text-[var(--text-primary)] outline-none resize-none"
                    />
                </div>

                {/* STDOUT / Console */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-[#181818] shrink-0 border-b border-[#333]">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Console Output</span>
                            {(execTime || memory) && (
                                <div className="text-[10px] text-zinc-500 font-mono bg-black/20 px-2 py-0.5 rounded">
                                    ⏱ {execTime || "? s"}  |  💾 {memory || "? KB"}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 text-zinc-500">
                             {hasErrors && (
                                 <button onClick={handleAiDebug} disabled={isAiLoading} title="AI Debug" className="hover:text-[var(--accent)] transition-colors p-1 flex items-center gap-1 text-[10px]">
                                      <Wand2 size={12} /> {isAiLoading ? "Debugging..." : "Fix Error"}
                                 </button>
                             )}
                             <button onClick={() => { setStdout(""); setStderr(""); setCompileError(""); }} title="Clear console" className="hover:text-red-400 transition-colors p-1">
                                 <Trash2 size={14} />
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full p-4 font-mono text-[13px] break-words whitespace-pre-wrap select-text">
                        {!stdout && !stderr && !compileError && !isRunning && (
                             <div className="text-zinc-600 h-full flex items-center justify-center italic text-sm text-center px-4">
                                  Output will appear here after execution...
                             </div>
                        )}
                        
                        {/* Standard Output */}
                        {stdout && <div className="text-green-400 font-semibold">{stdout}</div>}
                        
                        {/* Errors */}
                        {(stderr || compileError) && (
                            <div className="text-red-400 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded font-normal">
                                <span className="font-bold flex items-center gap-1.5 mb-1"><AlertCircle size={14}/> Execution Error</span>
                                {compileError}{stderr}
                            </div>
                        )}

                        {/* AI Debug Window */}
                        {showAi && (
                            <div className="mt-4 border border-[var(--border)] bg-[#1a1a1a] rounded-lg overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-elevated)] border-b border-[#333]">
                                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase flex items-center gap-1.5"><Wand2 size={12}/> AI Debugger Analysis</span>
                                    <button onClick={() => setShowAi(false)} className="text-zinc-500 hover:text-white transition-colors">×</button>
                                </div>
                                <div className="p-3 text-[12px] text-zinc-300 font-sans leading-relaxed">
                                    {isAiLoading && !aiDebugResponse ? (
                                        <span className="animate-pulse">Analyzing the stack trace...</span>
                                    ) : (
                                         <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-[#000] prose-pre:border prose-pre:border-[#333]">
                                            {/* Instead of importing ReactMarkdown just for this terminal box, we use simple pre HTML since it returns markdown block */}
                                            {aiDebugResponse ? aiDebugResponse : <span className="opacity-50">No data.</span>}
                                         </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
