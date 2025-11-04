# Vercel Deployment Guide - Incident Bot

## ⚠️ Important: Vercel Considerations

**Before deploying to Vercel, please note:**

Vercel is optimized for **serverless functions** and **static sites**, not long-running services. Your Incident Bot is currently structured as a persistent Node.js server with Express + Slack Bolt.

### Vercel Limitations
- **10-second timeout** on Hobby tier (30s on Pro tier)
- No persistent processes or background tasks
- Each request spawns a new serverless function
- Teams cache refresh won't work as a background task

### Recommended Alternatives (If Issues Arise)
If you encounter limitations with Vercel:
- **Railway.app** - Better for long-running Node.js apps (free tier available)
- **Render.com** - Excellent for persistent services (free tier available)
- **Fly.io** - Great for always-on services

**That said, your current bot should work on Vercel** since it primarily responds to HTTP webhooks from Slack. The configuration below is optimized for Vercel's serverless architecture.

---

## Prerequisites

Before deploying, ensure you have:

1. ✅ **GitHub Repository**
   - Your code should be pushed to GitHub
   - Repository: `https://github.com/your-username/incident-bot`

2. ✅ **Vercel Account**
   - Sign up at https://vercel.com (free for personal projects)
   - Install Vercel CLI (optional but helpful):
     ```bash
     npm install -g vercel
     ```

3. ✅ **All Environment Variables Ready**
   - Slack Bot Token
   - Slack Signing Secret
   - Notion Integration Token
   - Notion Database IDs

---

## Step-by-Step Deployment

### Phase 1: Prepare Your Repository

1. **Build the Project Locally** (verify it compiles)
   ```bash
   npm run build
   ```
   - ✅ Should create `dist/` folder with compiled JavaScript
   - ✅ No TypeScript errors

2. **Test Locally Before Deploying**
   ```bash
   npm start
   ```
   - Visit `http://localhost:3000/health`
   - Should return `{"status":"ok","slack":"connected","notion":"connected"}`

3. **Commit All Changes**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

---

### Phase 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**

2. **Import Your Git Repository**
   - Select **GitHub** as the source
   - Authorize Vercel to access your GitHub repos
   - Find and select `incident-bot` repository
   - Click **"Import"**

3. **Configure Project Settings**
   - **Project Name:** `incident-bot` (or your preferred name)
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables**
   Click **"Environment Variables"** and add each one:

   | Variable Name | Value | Note |
   |---------------|-------|------|
   | `SLACK_BOT_TOKEN` | `xoxb-your-token` | From Slack App OAuth page |
   | `SLACK_SIGNING_SECRET` | `your-secret` | From Slack App Basic Info |
   | `NOTION_TOKEN` | `secret_...` | From Notion Integration |
   | `NOTION_DB_ID` | `your-db-id` | Incidents database ID |
   | `NOTION_TEAMS_DB_ID` | `teams-db-id` | Teams database ID |
   | `NODE_ENV` | `production` | Set environment to production |

   **Important:** Mark all as **"Production", "Preview", and "Development"** environments

5. **Deploy**
   - Click **"Deploy"**
   - Vercel will build and deploy your app (takes 1-2 minutes)
   - You'll get a deployment URL like: `https://incident-bot.vercel.app`

---

#### Option B: Using Vercel CLI (For Advanced Users)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Link to existing project or create new one
   - Set environment variables when prompted

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

### Phase 3: Update Slack App URLs

**⚠️ CRITICAL STEP - Your bot won't work until you do this!**

Your Slack app is currently configured with ngrok URLs. You must update these to your Vercel production URL.

1. **Get Your Vercel URL**
   - From Vercel dashboard: `https://your-project-name.vercel.app`
   - Or from deployment: `https://incident-bot-xxxxx.vercel.app`

2. **Go to Slack App Configuration**
   - Visit https://api.slack.com/apps
   - Select your **"Incident Bot"** app

3. **Update Slash Commands**
   - Navigate to **"Slash Commands"** in sidebar
   - Click on `/incident` command
   - Update **Request URL** to:
     ```
     https://your-project-name.vercel.app/slack/events
     ```
   - Click **"Save"**

4. **Update Interactivity & Shortcuts**
   - Navigate to **"Interactivity & Shortcuts"**
   - Update **Request URL** to:
     ```
     https://your-project-name.vercel.app/slack/events
     ```
   - Click **"Save Changes"**

5. **Verify Event Subscriptions** (if you add them later for Sprint 2)
   - Navigate to **"Event Subscriptions"**
   - Update **Request URL** if enabled

---

### Phase 4: Test Your Deployment

1. **Health Check**
   - Visit: `https://your-project-name.vercel.app/health`
   - Should return:
     ```json
     {
       "status": "ok",
       "slack": "connected",
       "notion": "connected"
     }
     ```
   - ✅ If you see this, your app is running!

2. **Test Slack Command**
   - Go to any Slack channel where the bot is installed
   - Type: `/incident test deployment`
   - ✅ Modal should open - if it does, success!

3. **Test Incident Creation**
   - Fill out the modal with test data
   - Submit
   - ✅ Check Notion database for new incident
   - ✅ Check Slack for confirmation message

4. **Test Message Shortcut**
   - Hover over any message
   - Click three-dots (⋮) menu
   - Select "Report as Incident"
   - ✅ Modal should open with pre-filled data

---

### Phase 5: Monitor Your Deployment

1. **View Logs in Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click **"Functions"** tab
   - View real-time logs of all requests

2. **Check for Errors**
   - Look for any red error messages
   - Common issues:
     - Missing environment variables
     - Slack URL not updated
     - Invalid tokens

3. **Monitor Performance**
   - Vercel shows response times for each function
   - If functions consistently timeout (10s limit), consider upgrading to Pro tier or switching platforms

---

## Troubleshooting

### Issue: "dispatch_failed" Error in Slack

**Cause:** Slack cannot reach your Vercel URL

**Solution:**
1. Verify Slack app URLs are updated to Vercel URL (not ngrok)
2. Check that deployment succeeded in Vercel dashboard
3. Test health endpoint: `https://your-url.vercel.app/health`

---

### Issue: "Internal Notion API Error" or "Unauthorized"

**Cause:** Notion token or database ID is incorrect or missing

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `NOTION_TOKEN` and `NOTION_DB_ID` are correct
3. Re-deploy to pick up changes:
   ```bash
   vercel --prod
   ```
   Or trigger redeploy from Vercel dashboard

---

### Issue: Functions Timing Out (10s limit)

**Cause:** Vercel Hobby tier has 10-second timeout for serverless functions

**Symptoms:**
- Thread message fetching fails for large threads
- Notion page creation times out

**Solutions:**
1. **Upgrade to Vercel Pro** ($20/month) - 30s timeout
2. **Optimize Code:**
   - Reduce thread message limit from 30 to 15
   - Simplify Notion page template
3. **Switch Platform:**
   - Railway, Render, or Fly.io handle long-running tasks better

---

### Issue: Teams Cache Not Refreshing

**Cause:** Vercel serverless functions don't maintain state between requests

**Solution:**
This is a known limitation. Each request creates a fresh function instance, so the 5-minute cache refresh won't work.

**Workarounds:**
1. **Fetch teams on every request** (slight performance hit)
   - Modify `src/slack/commands/incident.ts`:
     ```typescript
     // Instead of getCachedTeams()
     const teams = await getTeams();
     ```
2. **Use Vercel Cron Jobs** (Pro tier only)
   - Can trigger cache refresh via HTTP endpoint
3. **Accept stale cache** - teams don't change often, it's okay

---

### Issue: Deployment Fails - "Cannot find module"

**Cause:** Dependencies not installed correctly

**Solution:**
1. Clear Vercel cache and redeploy:
   - Vercel Dashboard → Project → Settings → General
   - Scroll to "Clear Cache and Redeploy"
2. Ensure `package.json` has all dependencies (not devDependencies)

---

## Production Checklist

Before going live with users:

- [ ] **Deployment**
  - [ ] Project deployed to Vercel successfully
  - [ ] Health endpoint returns `200 OK`
  - [ ] Environment variables all set correctly

- [ ] **Slack App Configuration**
  - [ ] Slash command URL updated to Vercel
  - [ ] Interactivity URL updated to Vercel
  - [ ] ngrok is no longer running locally
  - [ ] All scopes added (`chat:write`, `commands`, `users:read`, `users:read.email`, `channels:history`, `groups:history`)

- [ ] **Testing**
  - [ ] `/incident` command works
  - [ ] Modal opens and submits successfully
  - [ ] Incident created in Notion
  - [ ] Confirmation posted to Slack
  - [ ] Message shortcut works ("Report as Incident")
  - [ ] Thread messages captured (if reporting from thread)

- [ ] **Monitoring**
  - [ ] Vercel logs show no errors
  - [ ] Function response times under 3s
  - [ ] No timeout warnings

- [ ] **Documentation**
  - [ ] Team knows how to use `/incident` command
  - [ ] Team knows how to use message shortcut for threads
  - [ ] USER_GUIDE.md shared with team

---

## Cost Breakdown

### Vercel Pricing

**Hobby Tier (Free):**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ 100GB-hours function execution
- ⚠️ 10-second function timeout
- ❌ No cron jobs

**Pro Tier ($20/month):**
- ✅ 1TB bandwidth/month
- ✅ 1000GB-hours function execution
- ✅ 30-second function timeout
- ✅ Cron jobs included
- ✅ Advanced analytics

**Recommendation:**
Start with **Hobby tier (free)**. Upgrade to Pro only if you hit limits or need longer timeouts.

---

## Alternative: Railway.app Deployment

If Vercel doesn't work well for your use case, Railway is a great alternative:

**Advantages:**
- Better for long-running Node.js servers
- No function timeout limits
- Persistent processes work correctly
- Free tier: $5/month credit (enough for small bots)

**Quick Deploy to Railway:**
1. Visit https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `incident-bot` repository
5. Add environment variables
6. Deploy!

Railway automatically detects Node.js and runs `npm start`.

---

## Maintenance

### Redeploying After Code Changes

**Automatic (Recommended):**
- Push to `main` branch on GitHub
- Vercel auto-deploys changes
- Takes 1-2 minutes

**Manual:**
```bash
vercel --prod
```

### Updating Environment Variables

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Update variable
3. **Important:** Redeploy for changes to take effect:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Viewing Logs

**Real-time:**
1. Vercel Dashboard → Your Project → Functions
2. See live requests and logs

**Via CLI:**
```bash
vercel logs <deployment-url>
```

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Monitor logs for first few days
3. ✅ Share with team and gather feedback
4. ✅ Consider implementing Sprint 2 (Two-way sync) if needed
5. ✅ Set up Vercel Cron Jobs for daily digest (Pro tier) or skip this feature

---

## Support

**Vercel Issues:**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

**Slack Issues:**
- Slack API Docs: https://api.slack.com
- Slack Community: https://slackcommunity.com

**Notion Issues:**
- Notion API Docs: https://developers.notion.com
- Notion Support: support@notion.so

---

*Last updated: 2025-11-04*
*Status: Ready for deployment*
