# Deploy to Vercel

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- Google Gemini API keys from [Google AI Studio](https://aistudio.google.com/apikey)

## Quick Deploy

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
cd devkit
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (select your account)
- Link to existing project? **N**
- Project name? **devkit** (or your choice)
- Directory? **./** (current directory)

### 4. Add Environment Variables

After deployment, add your API keys in the **Vercel Dashboard**:

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value |
|----------|-------|
| `GOOGLE_API_KEY_1` | Your first Google Gemini API key |
| `GOOGLE_API_KEY_2` | (Optional) Second key for rotation |
| `GOOGLE_API_KEY_3` | (Optional) Third key for rotation |
| `UPSTASH_REDIS_REST_URL` | (Optional) Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | (Optional) Upstash Redis token |
| `JUDGE0_API_HOST` | (Optional) Judge0 host, e.g., `https://your-judge0-instance.com` |

4. Click **Save**

### 5. Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

## Environment Variables Reference

### Required

- **`GOOGLE_API_KEY_1`** - At least one Google Gemini API key is required for AI features

### Optional

- **`GOOGLE_API_KEY_2`** through **`GOOGLE_API_KEY_6`** - Additional keys for automatic rotation
- **`UPSTASH_REDIS_REST_URL`** & **`UPSTASH_REDIS_REST_TOKEN`** - For rate limiting (get from [Upstash](https://console.upstash.com))
- **`JUDGE0_API_HOST`** - For code execution (self-host via Docker: `docker run -p 2358:2358 judge0/judge0`)

## Local Development

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Add your API keys to `.env.local`

3. Run development server:

```bash
npm run dev
```

## Troubleshooting

### WASM Loading Errors

The `vercel.json` includes required COOP/COEP headers for `sql.js` WASM. If you see WASM errors:

1. Verify headers are applied in Vercel dashboard → Deployments → Select deployment → Headers
2. Clear browser cache and redeploy

### API Key Errors

- **"No Google API keys configured"** - Add at least `GOOGLE_API_KEY_1` in Vercel environment variables
- **Rate limit errors** - Add multiple API keys for automatic rotation

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Production Checklist

- ✅ At least one Google API key added
- ✅ Environment variables set in Vercel dashboard
- ✅ Build completes successfully
- ✅ Test AI features in production
- ✅ (Optional) Set up Upstash for rate limiting
- ✅ (Optional) Deploy Judge0 for code execution
