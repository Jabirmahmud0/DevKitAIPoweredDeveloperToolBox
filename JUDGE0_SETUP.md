# Deploy Judge0 to Render

This guide will help you deploy Judge0 to Render for production use with DevKit.

---

## Step 1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub (recommended) or email
3. Complete the onboarding

---

## Step 2: Push Your Code to GitHub

Make sure your DevKit code (including the `Dockerfile.judge0` and `render.yaml` files) is pushed to GitHub:

```bash
cd F:\PieceOfShit\Projects\DevKit\devkit
git add Dockerfile.judge0 render.yaml JUDGE0_SETUP.md
git commit -m "Add Judge0 deployment files for Render"
git push origin main
```

---

## Step 3: Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository: `DevKit`

---

## Step 4: Configure the Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `devkit-judge0` (or your choice) |
| **Region** | Oregon (closest to you) |
| **Branch** | `main` |
| **Root Directory** | Leave blank |
| **Runtime** | `Docker` |
| **DockerfilePath** | `Dockerfile.judge0` |
| **Plan** | **Free** |

### Auto-Deploy
- ✅ Enabled (recommended)

---

## Step 5: Add Environment Variables

In the Render dashboard, go to **Environment** tab and add:

| Key | Value | Notes |
|-----|-------|-------|
| `RAILS_ENV` | `production` | Required |
| `SECRET_KEY_BASE` | *(Click "Generate" to create random)* | Required |
| `POSTGRES_USER` | `judge0` | Required |
| `POSTGRES_PASSWORD` | `judge0_password_123` | Change to something secure |
| `POSTGRES_DB` | `judge0` | Required |
| `REDIS_URL` | `redis://localhost:6379` | Required |

---

## Step 6: Add Persistent Disk

1. Go to **Disks** tab
2. Click **"Add Disk"**
3. Configure:
   - **Mount Path:** `/var/lib/postgresql/data`
   - **Size:** `1 GB` (minimum for free tier)

---

## Step 7: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll see a URL like:
   ```
   https://devkit-judge0.onrender.com
   ```

---

## Step 8: Test Judge0 API

Open your browser and visit:
```
https://devkit-judge0.onrender.com/
```

You should see:
```
{"message":"Judge0 is running!"}
```

Or test with a simple code execution:
```bash
curl -X POST "https://devkit-judge0.onrender.com/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"Hello World\")","language_id":71}'
```

---

## Step 9: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your DevKit project
3. Go to **Settings** → **Environment Variables**
4. Add:

| Variable | Value |
|----------|-------|
| `JUDGE0_API_HOST` | `https://devkit-judge0.onrender.com` |

5. Click **Save**

---

## Step 10: Redeploy to Vercel

```bash
cd F:\PieceOfShit\Projects\DevKit\devkit
vercel --prod
```

---

## ⚠️ Important Notes

### Free Tier Limitations

- **750 hours/month** of runtime (enough for 24/7 for one service)
- **Sleeps after 15 minutes** of inactivity
- **First request after sleep** takes 30-60 seconds to respond
- **1 GB disk** for PostgreSQL data

### Waking Up the Service

If your Judge0 instance sleeps:
1. Visit the Render URL in browser
2. Wait for it to load (~30-60 seconds)
3. Subsequent requests will be fast

### Upgrade Options

If you need always-on service:
- **Render Standard:** $7/month (no sleep, more resources)
- **Pro:** $15/month (even more resources)

---

## Troubleshooting

### "Service Unavailable" or 502 Error

- Wait a few minutes - service might be starting up
- Check Render dashboard for logs

### "Disk Full" Error

- Delete old submissions in Judge0
- Upgrade disk size in Render dashboard

### Slow First Request

- This is normal for free tier (service waking up)
- Subsequent requests are fast

### PostgreSQL Errors

- Make sure disk is mounted at `/var/lib/postgresql/data`
- Check environment variables are correct

---

## Alternative: Use Render's Managed PostgreSQL

For better reliability, you can use Render's managed PostgreSQL:

1. Create new **PostgreSQL** database on Render
2. Get the connection URL
3. Update `DATABASE_URL` environment variable in Judge0 service

This costs $7/month but provides better performance and reliability.

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Judge0 on Render | Free | $0/month |
| Vercel | Hobby | $0/month |
| **Total** | | **$0/month** 🎉 |

---

**Need help?** Check [Render Docs](https://render.com/docs) or [Judge0 Docs](https://judge0.com/docs/)
