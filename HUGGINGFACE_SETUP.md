# Deploy Judge0 to Hugging Face Spaces (FREE)

This guide will help you deploy Judge0 to Hugging Face Spaces for **FREE** with no request limits.

---

## Step 1: Create Hugging Face Account

1. Go to [https://huggingface.co](https://huggingface.co)
2. Click **Sign Up**
3. Sign up with GitHub (recommended) or email

---

## Step 2: Create New Space

1. Go to [https://huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in:
   - **Space name:** `judge0` (or any name you like)
   - **License:** MIT
   - **SDK:** `Docker`
   - **Visibility:** Public
3. Click **Create Space**

---

## Step 3: Upload Files

### Option A: Upload via Web Interface (Easiest)

1. In your new Space, click **"Files"** → **"Add file"** → **"Create a new file"**
2. Create `Dockerfile` with this content:

```dockerfile
FROM judge0/judge0:latest

WORKDIR /app

EXPOSE 7860

ENV RAILS_ENV=production
ENV SECRET_KEY_BASE=change-this-to-random-string
ENV POSTGRES_USER=judge0
ENV POSTGRES_PASSWORD=judge0
ENV POSTGRES_DB=judge0
ENV REDIS_URL=redis://localhost:6379

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7860/ || exit 1

CMD ["./scripts/server", "-p", "7860"]
```

3. Click **Commit new file to main**

4. Create `requirements.txt` (can be empty or with comment):

```
# No Python dependencies - using Docker
```

5. Create `README.md`:

```markdown
---
title: Judge0 CE - Code Execution API
emoji: 🚀
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
license: mit
---

# Judge0 CE API

Free code execution API powered by Judge0.

## Usage

```bash
curl -X POST "https://YOUR-USERNAME-judge0.hf.space/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"Hello\")","language_id":71}'
```
```

### Option B: Upload via Git (Advanced)

```bash
# Clone your Space
git clone https://huggingface.co/spaces/YOUR-USERNAME/judge0
cd judge0

# Copy files from huggingface-judge0 folder
cp /path/to/devkit/huggingface-judge0/* .

# Commit and push
git add .
git commit -m "Add Judge0 Docker setup"
git push
```

When prompted for password, use a **Hugging Face Access Token**:
1. Go to [Settings → Tokens](https://huggingface.co/settings/tokens)
2. Create new token with **Write** permission
3. Use token as password

---

## Step 4: Wait for Deployment

1. Hugging Face will build your Docker image (5-10 minutes)
2. Once ready, you'll see **"Running"** status
3. Your API URL will be:
   ```
   https://YOUR-USERNAME-judge0.hf.space
   ```

---

## Step 5: Test Your API

Open your browser and visit:
```
https://YOUR-USERNAME-judge0.hf.space/
```

You should see:
```json
{"message":"Judge0 is running!"}
```

Or test with curl:
```bash
curl -X POST "https://YOUR-USERNAME-judge0.hf.space/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"Hello World\")","language_id":71}'
```

Expected response:
```json
{
  "stdout": "Hello World\n",
  "time": "0.001",
  "memory": 3456,
  "status": {"id": 3, "description": "Accepted"}
}
```

---

## Step 6: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your DevKit project
3. **Settings** → **Environment Variables**
4. Add:

| Variable | Value |
|----------|-------|
| `JUDGE0_API_HOST` | `https://YOUR-USERNAME-judge0.hf.space` |

5. Click **Save**

---

## Step 7: Redeploy to Vercel

```bash
cd F:\PieceOfShit\Projects\DevKit\devkit
vercel --prod
```

---

## ⚠️ Important Notes

### Cold Start

- Hugging Face Spaces **sleep after inactivity**
- First request after sleep takes **30-60 seconds**
- Subsequent requests are fast

### Keep Your Space Awake

To prevent cold starts, you can:
1. Use a free uptime monitor like [UptimeRobot](https://uptimerobot.com/)
2. Ping your Space every 5 minutes:
   ```
   https://YOUR-USERNAME-judge0.hf.space/
   ```

### Rate Limits

- **No official rate limits** on Hugging Face Spaces
- Fair use policy applies
- Free tier is generous for personal projects

### Storage

- **1GB storage** included
- Judge0 submissions are temporary
- No persistent storage needed

---

## Troubleshooting

### "Building" Forever

- Check Dockerfile syntax
- Make sure you're using `judge0/judge0:latest` base image
- Check build logs in Hugging Face dashboard

### 500 Error

- Wait a few minutes for initialization
- Check Space logs for errors
- Make sure port is 7860 (required by HF)

### "No such file or directory"

- Ensure all files are uploaded (Dockerfile, requirements.txt, README.md)
- Check file names are exact (case-sensitive)

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Judge0 on Hugging Face | Free | $0/month |
| DevKit on Vercel | Hobby | $0/month |
| Google Gemini API | Free tier | $0/month |
| **Total** | | **$0/month** 🎉 |

---

## Example Usage in DevKit

Once deployed, your Code Runner tool will work in production!

**Local:**
```
JUDGE0_API_HOST=http://localhost:2358
```

**Production (Vercel):**
```
JUDGE0_API_HOST=https://YOUR-USERNAME-judge0.hf.space
```

---

**Need help?** 
- [Hugging Face Spaces Docs](https://huggingface.co/docs/hub/spaces)
- [Judge0 Docs](https://judge0.com/docs/)
- [Docker Spaces Guide](https://huggingface.co/docs/hub/spaces-sdks-docker)
