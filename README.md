# DevKit — AI-Powered Developer Toolbox

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI-SDK-black?logo=vercel)](https://sdk.vercel.ai/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5a0fc8)](https://web.dev/progressive-web-apps/)

**10 powerful developer tools in one tabbed interface** — powered by AI, WebAssembly, and modern web technologies.

![DevKit Preview](./preview.png)

---

## 🚀 Features

### 10 Developer Tools

| # | Tool | Technologies | What It Does |
|---|------|-------------|--------------|
| 1 | **🔍 AI Code Reviewer** | Gemini, Monaco Editor | Paste any code snippet and get instant AI-powered code review. Identifies security vulnerabilities, performance issues, potential bugs, and suggests improvements with code examples. Supports multiple languages. |
| 2 | **📦 JSON Toolkit** | jsdiff, JMESPath, Workers | Complete JSON toolbox: format/minify JSON, validate syntax, compare two JSON objects with visual diff, query JSON using JMESPath expressions, and generate TypeScript interfaces + Zod schemas from JSON using AI. |
| 3 | **🧪 Regex Lab** | XRegExp, Web Workers | Build, test, and understand regular expressions. Real-time regex matching with highlighted results, AI-powered regex explanation (paste regex, get plain English breakdown), and AI regex generation (describe pattern in words, get working regex). |
| 4 | **📝 Markdown Studio** | react-markdown, Mermaid | Full-featured Markdown editor with split-pane live preview. AI writing assistant to improve/expand content, Mermaid diagram support, table of contents generation, word count, reading time, and export to PDF/HTML. |
| 5 | **🔐 Crypto Toolkit** | Web Crypto, WASM, jose | Client-side cryptographic tools: hash functions (SHA-256, SHA-512, MD5), encoding (Base64, Hex), encryption/decryption (AES), JWT token debugging, UUID/guid generation. All operations run locally in browser. |
| 6 | **💾 SQL Playground** | sql.js (WASM) | In-browser SQLite database powered by WebAssembly. Write and execute SQL queries, AI SQL query builder (describe query in English, get SQL), sample datasets included, query results with export. No server needed. |
| 7 | **▶️ Code Runner** | Judge0 API | Execute code in 40+ programming languages directly in browser. Supports Python, JavaScript, Java, C++, Go, Rust, and more. AI-powered error debugging explains compile/runtime errors and suggests fixes. |
| 8 | **🎨 AI Color Studio** | chroma.js, culori, Gemini | Generate professional color palettes from text descriptions. AI creates cohesive 5-color palettes matching your brand/emotion. Live preview on UI mockups, accessibility contrast checking, export as CSS/JSON/Tailwind config. |
| 9 | **🌐 API Tester** | axios, Zustand | Lightweight HTTP client (mini Postman). Build and test REST APIs with full control over method, headers, query params, and body. Save collections, view response headers/timing, AI-assisted request builder. |
| 10 | **🌳 AST Explorer** | @babel/parser, D3 | Visualize JavaScript/TypeScript Abstract Syntax Trees. Interactive tree view with node highlighting, click any node to see detailed explanation powered by AI. Understand how parsers interpret your code. |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + CSS custom properties
- **State:** Zustand (persistent stores)
- **Database:** IndexedDB (via `idb`) for history
- **AI:** Vercel AI SDK (Google Gemini, OpenAI GPT-4o-mini, Anthropic Claude)
- **Editor:** Monaco Editor (20+ languages)
- **Workers:** Web Workers + Comlink for heavy computation
- **WASM:** sql.js (SQLite), bcryptjs
- **PWA:** next-pwa with offline caching
- **Animations:** Framer Motion

---

## 📦 Installation

### Prerequisites

- Node.js 20+ 
- npm or pnpm
- API keys (see below)

### Quick Start

```bash
# Clone the repository
cd devkit

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**For deployment instructions, see [DEPLOY.md](./DEPLOY.md)**

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# ─── Google Gemini API Keys (Auto-Rotation) ──────────────────────────────────
# Add at least one API key. System rotates between keys on failure/rate limits.
# Get keys from: https://aistudio.google.com/apikey
GOOGLE_API_KEY_A=
GOOGLE_API_KEY_B=
GOOGLE_API_KEY_C=
GOOGLE_API_KEY_D=
GOOGLE_API_KEY_E=
GOOGLE_API_KEY_F=

# ─── Rate Limiting (Upstash Redis) ──────────────────────────────────────────
# Optional: For production rate limiting. Leave empty for no rate limiting.
# Get credentials from: https://console.upstash.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ─── Code Execution (Judge0 Self-Hosted) ────────────────────────────────────
# Optional: For Code Runner tool. Leave empty to disable code execution.
# Self-hosted via Docker: docker run -p 2358:2358 judge0/judge0
JUDGE0_API_HOST=http://localhost:2358
```

### Getting API Keys

| Service | URL | Free Tier | Used By |
|---------|-----|-----------|---------|
| **Google AI Studio** | https://aistudio.google.com/apikey | ✅ 1500 req/day | All AI features |
| **Upstash Redis** | https://upstash.com/ | ✅ 10k req/day | Rate limiting (optional) |
| **Judge0 (Local)** | Docker | ✅ Free | Code Runner (local) |
| **Judge0 (HF Spaces)** | https://huggingface.co/spaces | ✅ Free | Code Runner (production) |

---

## 📁 Project Structure

```
devkit/
├── app/
│   ├── api/
│   │   ├── ai/           # AI-powered API routes
│   │   │   ├── review/   # Code review
│   │   │   ├── json/     # JSON schema generation
│   │   │   ├── regex/    # Regex explain/generate
│   │   │   ├── sql/      # SQL query builder
│   │   │   ├── debug/    # Code debugging
│   │   │   ├── color/    # Color palette generation
│   │   │   ├── markdown/ # Markdown improvement
│   │   │   ├── api-builder/ # HTTP request builder
│   │   │   └── ast/      # AST node explanation
│   │   └── execute/      # Judge0 code execution proxy
│   ├── globals.css       # Design tokens + global styles
│   ├── layout.tsx        # Root layout + PWA meta
│   └── page.tsx          # Main SPA shell
├── components/
│   ├── shell/            # App shell components
│   │   ├── TabBar.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── HistoryPanel.tsx
│   │   └── SettingsModal.tsx
│   └── tools/            # Tool-specific components
│       ├── CodeReviewer/
│       ├── JsonToolkit/
│       ├── RegexLab/
│       ├── MarkdownStudio/
│       ├── CryptoToolkit/
│       ├── SqlPlayground/
│       ├── CodeRunner/
│       ├── ColorStudio/
│       ├── ApiTester/
│       └── AstExplorer/
├── lib/
│   ├── ai/               # AI helpers (Vercel SDK)
│   ├── db/               # IndexedDB operations
│   ├── stores/           # Zustand stores
│   ├── workers/          # Web Workers (Comlink)
│   ├── ratelimit.ts      # Upstash rate limiting
│   └── tools.ts          # Tool registry
├── public/
│   ├── manifest.json     # PWA manifest
│   └── icons/            # PWA icons
└── next.config.ts        # PWA + WASM config
```

---

## 🎯 Architecture

### App Shell Pattern

DevKit uses a **single-page application (SPA)** shell with tab-based navigation:

```
┌─────────────────────────────────────────────┐
│  Header (Logo, Cmd+K, History, Settings)    │
├─────────────────────────────────────────────┤
│  Tab Bar (10 tools, Cmd+1-0 shortcuts)      │
├─────────────────────────────────────────────┤
│                                             │
│   Active Tool Component (lazy-loaded)       │
│   - Monaco Editor                           │
│   - AI Streaming Panel                      │
│   - Tool-specific UI                        │
│                                             │
└─────────────────────────────────────────────┘
```

### AI Layer

All AI tools use **Google Gemini** with a unified streaming pattern:

```typescript
// lib/ai/index.ts
export async function generateStreamingText(
    prompt: string,
    system?: string,
    model?: string
): Promise<ReadableStream>
```

**Features:**
- **Automatic API Key Rotation** - System rotates between 6 API keys on failure or rate limits
- **Exponential Backoff** - Automatic retry with increasing delays on errors
- **Streaming Responses** - Real-time token streaming for instant feedback
- **System Prompts** - Each tool has specialized prompts for consistent output

**AI-Powered Tools:**
| Tool | AI Functionality |
|------|------------------|
| Code Reviewer | Analyzes code for bugs, security issues, and suggests fixes |
| JSON Toolkit | Generates TypeScript interfaces and Zod schemas from JSON |
| Regex Lab | Explains regex patterns and generates regex from descriptions |
| SQL Playground | Converts natural language to SQL queries |
| Debug Tool | Explains errors and provides fix suggestions |
| Color Studio | Generates color palettes from text descriptions |
| Markdown Studio | Improves writing and expands content |
| API Tester | Builds HTTP requests from natural language |
| AST Explorer | Explains AST nodes in plain English |

### Web Workers

Heavy computation (regex matching, JSON diffing) runs off the main thread:

```typescript
// Regex Worker with Comlink
import * as Comlink from "comlink";
const worker = new Worker(new URL("@/lib/workers/regex.worker.ts", import.meta.url));
const api = Comlink.wrap(worker);
const result = await api.runRegex(pattern, flags, testString);
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd/Ctrl + 1-9` | Switch to tool 1-9 |
| `Cmd/Ctrl + 0` | Switch to tool 10 |
| `Escape` | Close modals/panels |

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Bundle analysis
ANALYZE=true npm run build

# Lighthouse audit (install first)
npx lighthouse http://localhost:3000 --output=html
```

---

## 📦 PWA Features

- **Offline Support:** SQL, Regex, JSON, and Crypto tools work offline
- **Installable:** Add to home screen on desktop/mobile
- **Cache Strategy:**
  - AI routes: NetworkFirst (7 days)
  - Static assets: StaleWhileRevalidate (30 days)
  - Images: CacheFirst (30 days)

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Steps:**
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables in **Settings → Environment Variables**:
   - `GOOGLE_API_KEY_A` through `GOOGLE_API_KEY_F` (at least one required)
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (optional)
   - `JUDGE0_API_HOST` (optional)
4. Deploy

See `DEPLOY.md` for detailed deployment instructions.

### Environment Variables in Production

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_API_KEY_A` | ✅ Yes | Primary AI API key |
| `GOOGLE_API_KEY_B-F` | ❌ Optional | Backup keys for auto-rotation |
| `UPSTASH_REDIS_REST_URL` | ❌ Optional | Rate limiting (production) |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ Optional | Rate limiting (production) |
| `JUDGE0_API_HOST` | ❌ Optional | Code execution (local: `http://localhost:2358`, production: Hugging Face Spaces URL) |

---

## 🎨 Design Tokens

DevKit uses a custom dark theme with CSS variables:

```css
:root {
  --bg-base: #0a0a0f;
  --bg-surface: #111118;
  --bg-elevated: #1a1a24;
  --accent: #7c6af5;
  --accent-glow: rgba(124, 106, 245, 0.25);
  --text-primary: #f0f0ff;
  --text-muted: #555570;
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for learning or production.

---

## 🙏 Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) for the streaming AI layer
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [sql.js](https://sql.js.org/) for in-browser SQLite
- [shadcn/ui](https://ui.shadcn.com/) for UI inspiration
- [Framer Motion](https://www.framer.com/motion/) for animations

---

**Built with ❤️ by DevKit Team**
