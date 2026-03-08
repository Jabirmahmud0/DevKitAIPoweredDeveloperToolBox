# Deploy Judge0 to Hugging Face Spaces (FREE)

Follow the official Hugging Face guide: https://huggingface.co/docs/hub/spaces-sdks-docker

---

## Step 1: Create Hugging Face Account

1. Go to [https://huggingface.co](https://huggingface.co)
2. Sign up with GitHub

---

## Step 2: Create New Space

1. Go to [https://huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in:
   - **Space name:** `judge0`
   - **License:** MIT
   - **SDK:** **Docker**
   - **Visibility:** Public
3. Click **Create Space**

---

## Step 3: Clone Your Space

```bash
# When prompted for password, use an access token with write permissions
# Generate one from: https://huggingface.co/settings/tokens
git clone https://huggingface.co/spaces/YOUR-USERNAME/judge0
cd judge0
```

---

## Step 4: Copy Files

Copy these files from `huggingface-judge0/` folder to your cloned space:

- `Dockerfile`
- `requirements.txt`
- `README.md`

---

## Step 5: Commit and Push

```bash
git add .
git commit -m "Add Judge0 code execution API"
git push
```

---

## Step 6: Wait for Deployment

- Docker builds (~5-10 minutes)
- Your API will be at: `https://YOUR-USERNAME-judge0.hf.space`

---

## Step 7: Test

```bash
curl -X POST "https://YOUR-USERNAME-judge0.hf.space/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"Hello World\")","language_id":71}'
```

---

## Step 8: Add to Vercel

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `JUDGE0_API_HOST=https://YOUR-USERNAME-judge0.hf.space`
3. Redeploy: `vercel --prod`

---

## Cost: $0/month ✅

