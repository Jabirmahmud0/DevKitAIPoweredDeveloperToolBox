# DevKit — AI-Powered Developer Toolbox

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI-SDK-black?logo=vercel)](https://sdk.vercel.ai/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5a0fc8)](https://web.dev/progressive-web-apps/)

**10 powerful developer tools in one tabbed interface** — powered by AI, WebAssembly, and modern web technologies.

![DevKit Preview](./preview.png)

---

## 🚀 Features

### 10 Developer Tools

| Tool | Technologies | Description |
|------|-------------|-------------|
| **🔍 AI Code Reviewer** | Gemini/GPT-4o/Claude, Monaco | Get instant AI feedback on security, performance, and best practices |
| **📦 JSON Toolkit** | jsdiff, JMESPath, Workers | Format, validate, diff, query, and convert JSON with AI schema generation |
| **🧪 Regex Lab** | XRegExp, Web Workers | Build and test regex patterns with real-time highlighting and AI explain |
| **📝 Markdown Studio** | react-markdown, Mermaid | Split-pane editor with live preview, AI writing assistant, and export |
| **🔐 Crypto Toolkit** | Web Crypto, WASM, jose | Hash, encode, encrypt, JWT debug, and generate UUIDs client-side |
| **💾 SQL Playground** | sql.js (WASM) | In-browser SQLite with AI query builder and sample datasets |
| **▶️ Code Runner** | Judge0 API | Execute code in 10+ languages with AI debugging |
| **🎨 AI Color Studio** | chroma.js, culori, Gemini | Generate accessible color palettes with live UI preview |
| **🌐 API Tester** | axios, Zustand | Full HTTP client with collections and AI request builder |
| **🌳 AST Explorer** | @babel/parser, D3 | Visualize JavaScript/TypeScript ASTs with AI node explanation |

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
cp .env.local.example .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# ─── AI Providers ───────────────────────────────────────────────────────────
GOOGLE_GENERATIVE_AI_API_KEY=     # Gemini 2.0 Flash
OPENAI_API_KEY=                   # GPT-4o-mini
ANTHROPIC_API_KEY=                # Claude Sonnet 3.5

# ─── Rate Limiting (Upstash Redis) ──────────────────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ─── Code Execution (Judge0 via RapidAPI) ───────────────────────────────────
JUDGE0_API_KEY=
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

### Getting API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| Google AI Studio | https://aistudio.google.com/apikey | ✅ 1500 req/day |
| OpenAI Platform | https://platform.openai.com/api-keys | ✅ $5 free credit |
| Anthropic Console | https://console.anthropic.com/ | ✅ Limited free tier |
| Upstash Redis | https://upstash.com/ | ✅ 10k req/day free |
| Judge0 (RapidAPI) | https://rapidapi.com/judge0-judge0-default/api/judge0-ce | ✅ 50 calls/month |

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

All AI tools use the **Vercel AI SDK** with a unified streaming pattern:

```typescript
// lib/ai/index.ts
export async function createStreamingAIResponse(
    prompt: string,
    model: AIModel,
    system?: string
): Promise<Response>
```

Each tool has its own API route with:
1. Rate limiting (Upstash Redis)
2. System prompts for consistent output
3. Streaming responses for real-time feedback

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

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### Custom Domain

1. Go to Vercel Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

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
