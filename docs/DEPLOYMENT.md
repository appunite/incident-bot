# Deployment Guide

The Incident Bot is deployed on **Railway**, a container-based hosting platform that provides:
- ✅ **No cold starts** - Container stays running 24/7
- ✅ **No timeout limits** - Can handle slow API responses
- ✅ **Persistent connections** - Ideal for Slack Bolt framework
- ✅ **Simple deployment** - Auto-deploys from GitHub via Dockerfile
- ✅ **Real-time logging** - Easy debugging and monitoring
- ✅ **Free tier** - $5 credit per month (sufficient for this app)

---

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **Git Repository**: Code pushed to GitHub
3. **Environment Variables**: Prepared from local `.env` file

---

## Step-by-Step Deployment

### 1. Create Railway Account

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account

### 2. Create New Project

**Option A: Via Railway Dashboard (Recommended)**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `appunite/incident-bot` repository
4. Railway will auto-detect the Dockerfile

**Option B: Via Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project in your repo
cd /path/to/incident-bot
railway init

# Link to GitHub repo
railway link
```

### 3. Configure Environment Variables

In Railway dashboard:

1. Go to your project → Variables tab
2. Add these variables:

```
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token (if using)
NOTION_TOKEN=secret_your-notion-token
NOTION_DB_ID=your-database-id
NODE_ENV=production
PORT=3000
```

**Important:** Railway automatically sets `PORT` but you can override it to 3000.

### 4. Deploy

**Via Dashboard:**
- Railway automatically deploys when you push to GitHub
- Check "Deployments" tab for progress

**Via CLI:**
```bash
railway up
```

### 5. Get Your Railway URL

1. Go to project → Settings tab
2. Click "Generate Domain"
3. Copy the generated URL (e.g., `https://incident-bot-production.up.railway.app`)

**Custom Domain (Optional):**
- Add your own domain in Settings → Domains
- Update DNS records as instructed

### 6. Update Slack App Configuration

Go to https://api.slack.com/apps → Your App:

#### Event Subscriptions:
- **Request URL**: `https://your-railway-url.railway.app/slack/events`
- Wait for "Verified ✓" checkmark

#### Interactivity & Shortcuts:
- **Request URL**: `https://your-railway-url.railway.app/slack/events`

#### Slash Commands:
- `/incident` command URL: `https://your-railway-url.railway.app/slack/events`

### 7. Test the Deployment

1. **Health Check**:
   ```bash
   curl https://your-railway-url.railway.app/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "slack": { "connected": true },
     "notion": { "connected": true }
   }
   ```

2. **In Slack**:
   - Type `/incident test` → Modal should open instantly (no cold start!)
   - Right-click any message → "Report as Incident" → Modal should open instantly

3. **Create Incident**:
   - Fill form and submit
   - Should see Slack confirmation within 5-10 seconds
   - Check Notion - page should have all properties and template structure

---

## Monitoring & Logs

### View Logs
**Railway Dashboard:**
1. Go to your project
2. Click "Deployments" tab
3. Click latest deployment
4. View real-time logs (no buffering like Vercel!)

**Railway CLI:**
```bash
railway logs
```

### Key Logs to Watch For:
```
✓ Slack app initialized
✓ Notion client initialized
✓ Incident modal opened successfully
✓ Incident created successfully in Notion
✓ Posted public thread reply
```

### Common Issues:

**Container crashes:**
```bash
# Check logs
railway logs --tail 100

# Restart deployment
railway restart
```

**Environment variables not working:**
```bash
# List variables
railway variables

# Add missing variable
railway variables set KEY=value
```

---

## Updating the Deployment

### Automatic (Recommended):
1. Push code to GitHub main branch
2. Railway auto-deploys
3. Check "Deployments" tab for status

### Manual:
```bash
railway up
```

---

## Rollback

If deployment fails:

1. Go to Deployments tab
2. Click previous successful deployment
3. Click "Redeploy"

Or via CLI:
```bash
railway rollback
```

---

## Migration Checklist

- [ ] Railway account created
- [ ] Project deployed
- [ ] Environment variables configured
- [ ] Domain generated
- [ ] Slack app URLs updated
- [ ] Health check passes
- [ ] `/incident` command works
- [ ] Message action works
- [ ] Incident creates in Notion successfully
- [ ] Slack confirmation posts
- [ ] (Optional) Vercel project deleted

---

## Troubleshooting

### Deployment fails

**Check build logs:**
```bash
railway logs --deployment
```

**Common fixes:**
- Ensure Dockerfile is in root directory
- Verify TypeScript compiles: `npm run build`
- Check that `dist/index.js` exists after build

### App crashes on startup

**Check runtime logs:**
```bash
railway logs
```

**Common causes:**
- Missing environment variables
- Port mismatch (ensure PORT=3000 or use `process.env.PORT`)
- Database connection issues

### Slack events not received

**Verify:**
1. Railway container is running (check dashboard)
2. URL is accessible: `curl https://your-url.railway.app/health`
3. Slack app URLs match Railway URL exactly
4. No trailing slashes in URLs

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

## Post-Deployment

After successful Railway deployment:

1. **Monitor usage**:
   - Check Railway usage in dashboard
   - Verify no crashes
   - Confirm costs are within $5/month credit

2. **Set up monitoring** (optional):
   - Add health check pings (UptimeRobot, BetterStack)
   - Set up error alerts
   - Configure log aggregation

---

**Congratulations! Your bot is now deployed on Railway with zero cold starts and reliable performance!** 🚀
