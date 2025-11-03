# =� Incident Bot - Development Roadmap

## Sprint 0: Project Setup & Infrastructure - COMPLETED

### Setup Tasks
- [x] **Initialize Node.js project** `@dev`
  - Create package.json with TypeScript, Slack Bolt, Notion SDK
  - Set up tsconfig.json
  - Configure build scripts
  - Add nodemon for development

- [x] **Create project folder structure** `@dev`
  - `src/slack/` - Slack handlers
  - `src/notion/` - Notion API clients
  - `src/utils/` - logging, error handling
  - `src/types/` - TypeScript type definitions
  - `src/config/` - environment configuration

- [x] **Set up environment configuration** `@dev`
  - Create `.env.example` file with all required variables
  - Create config loader in `src/config/env.ts`
  - Add environment validation on startup

- [x] **Create Slack App** `@prabel` ='
  - Go to https://api.slack.com/apps
  - Create new app "Incident Bot"
  - Add Bot Token Scopes: `chat:write`, `commands`, `users:read`
  - Install app to workspace
  - Copy Bot User OAuth Token � `SLACK_BOT_TOKEN`
  - Copy Signing Secret � `SLACK_SIGNING_SECRET`
  - Update `.env` file with tokens

- [x] **Create Notion Integration** `@prabel` ='
  - Go to https://www.notion.so/my-integrations
  - Create new integration "Incident Bot"
  - Copy Internal Integration Token � `NOTION_TOKEN`
  - Create "Incidents" database in Notion workspace
  - Share database with integration
  - Copy database ID from URL � `NOTION_DB_ID`
  - Update `.env` file with Notion credentials

- [x] **Set up basic Express server** `@dev`
  - Create `src/index.ts` with Express + Slack Bolt
  - Add `/health` endpoint for monitoring
  - Add `/slack/events` endpoint for Slack events
  - Test server starts successfully

** Sprint 0 Testing Checkpoint** `@prabel`
- [x] Run `npm run dev` - server should start without errors
- [x] Visit `http://localhost:3000/health` - should return 200 OK
- [x] Verify all environment variables are loaded correctly


**Sprint 0 Status: ✅ COMPLETED (2025-11-03)**
- All infrastructure set up successfully
- Server running and tested
- Slack connection: ✅ Connected (team: Appunite, user: incident_bot)
- Notion connection: ✅ Connected
- Health endpoint: ✅ Passing
---

## =� Sprint 1: Basic Incident Creation Flow

### Notion Database Schema
- [x] **Define Notion database properties** `@prabel` ='
  - ✅ Created properties in Notion "Incidents" database (see NOTION_DATABASE.md)
  - ✅ All properties aligned with actual schema

### Slack Command Implementation
- [x] **Register `/incident` slash command** `@prabel` ='
  - ✅ Slash command registered in Slack App
  - ✅ Request URL configured with ngrok
  - ✅ Command working and tested

- [x] **Create Slack modal view** `@dev`
  - ✅ File: `src/slack/views/incidentModal.ts`
  - ✅ Form fields: Title, Description, Severity (6 options), Area (5 options)
  - ✅ Using Slack Block Kit for UI
  - ✅ Validation for required fields

- [x] **Implement `/incident` command handler** `@dev`
  - ✅ File: `src/slack/commands/incident.ts`
  - ✅ Listens for `/incident` command
  - ✅ Opens modal using `client.views.open()`
  - ✅ Error handling implemented

- [x] **Implement modal submission handler** `@dev`
  - ✅ File: `src/slack/handlers/incidentSubmission.ts`
  - ✅ Listens for `incident_modal` view submission
  - ✅ Extracts form data from payload
  - ✅ Validates all required fields
  - ✅ Calls Notion API to create incident

### Notion Integration
- [x] **Create Notion client wrapper** `@dev`
  - ✅ File: `src/notion/client.ts`
  - ✅ Notion client initialized with token
  - ✅ Error handling implemented

- [x] **Implement incident creation in Notion** `@dev`
  - ✅ File: `src/notion/createIncident.ts`
  - ✅ Function: `createIncident(data: IncidentData)`
  - ✅ Maps Slack form data to Notion properties
  - ✅ Sets CreatedFrom = "Automatic"
  - ✅ Sets Detected Date to current timestamp
  - ✅ Sets Trigger = "Slack /incident command"
  - ✅ Returns Notion page ID and URL

- [x] **Post confirmation to Slack thread** `@dev`
  - ✅ File: `src/slack/messages/confirmationMessage.ts`
  - ✅ Posts message to channel after Notion creation
  - ✅ Includes incident title, severity, area, description, and Notion link
  - ✅ Stores thread_ts for future updates

- [x] **Update Notion with Slack thread info** `@dev`
  - ✅ File: `src/notion/updateIncident.ts`
  - ✅ Updates Notion page after posting confirmation
  - ✅ Stores: Slack Message URL, Slack Thread ID, Slack Channel ID
  - ✅ Sets Last Synced timestamp
  - ✅ Enables two-way sync later

### Error Handling & Logging
- [x] **Create logging utility** `@dev`
  - ✅ File: `src/utils/logger.ts`
  - ✅ Using Winston for structured logging
  - ✅ Log levels: error, warn, info, debug
  - ✅ Logs to console in development
  - ✅ Module-based logging with createModuleLogger()

- [x] **Add error handling middleware** `@dev`
  - ✅ Error handling in all handlers
  - ✅ Catches and logs all errors
  - ✅ Sends user-friendly messages to Slack
  - ✅ Internal errors not exposed to users

** Sprint 1 Testing Checkpoint** `@prabel`
- [ ] **Test: Basic Incident Creation**
  1. In Slack, type `/incident` in any channel
  2. Modal should open with form fields
  3. Fill in: Title, Description, select Severity & Area
  4. Click Submit
  5.  Verify: Confirmation message appears in Slack thread
  6.  Verify: New page created in Notion "Incidents" database
  7.  Verify: All fields are correctly populated in Notion
  8.  Verify: Slack Thread URL is saved in Notion

- [ ] **Test: Validation**
  1. Type `/incident`, leave Title empty, submit
  2.  Verify: Error message about required fields

- [ ] **Test: Error Handling**
  1. Temporarily break Notion connection (invalid token)
  2. Try creating incident
  3.  Verify: User sees friendly error message
  4.  Verify: Error is logged in console

---

## 📝 Sprint 1.5: Enhancement - Rich Description Support

### Description as Page Content
- [x] **Move description to Notion page body** `@dev`
  - File: `src/notion/createIncident.ts`
  - Instead of setting Description as a property, add it to the page body/content
  - Use Notion's block API to create rich text content
  - Benefits: Better formatting, more space, supports rich text features
  - Keep Description property empty or remove if not needed
  - Update page creation to include `children` array with paragraph blocks

- [x] **Update Slack modal for rich text** `@dev` (optional)
  - Consider if Slack modal needs changes
  - Current multiline input should work fine
  - May support basic markdown if needed

---

## = Sprint 2: Two-Way Sync (Notion � Slack)

### Sync Infrastructure
- [ ] **Create sync watcher service** `@dev`
  - File: `src/notion/syncWatcher.ts`
  - Function: `fetchRecentUpdates()`
  - Poll Notion every 5 minutes for edited pages
  - Filter for incidents modified in last 10 minutes
  - Compare with cached state

- [ ] **Implement state caching** `@dev`
  - File: `src/utils/cache.ts`
  - Store last known state of each incident (Status, Owner)
  - Use in-memory cache for now (Map or simple object)
  - Detect which fields changed

- [ ] **Detect meaningful changes** `@dev`
  - File: `src/notion/changeDetector.ts`
  - Track changes in: Status, Owner, Accountable
  - Ignore changes in: Description edits, internal fields
  - Return list of incidents with changes

### Slack Thread Updates
- [ ] **Create thread update message formatter** `@dev`
  - File: `src/slack/messages/updateMessage.ts`
  - Format: "= Incident updated: Status changed to In Progress"
  - Format: "=d Owner assigned: @username"
  - Use mentions for person fields

- [ ] **Implement thread update poster** `@dev`
  - File: `src/slack/handlers/postUpdate.ts`
  - Get Slack Channel ID and Thread TS from Notion
  - Post update as threaded reply using `chat.postMessage()`
  - Handle cases where thread no longer exists

- [ ] **Set up polling interval** `@dev`
  - File: `src/services/scheduler.ts`
  - Use `setInterval()` to run sync every 5 minutes
  - Add graceful shutdown handling
  - Log sync runs and results

### Notion Person � Slack User Mapping
- [ ] **Create user mapper utility** `@dev`
  - File: `src/utils/userMapper.ts`
  - Map Notion person email to Slack user ID
  - Use `client.users.lookupByEmail()` from Slack API
  - Cache mappings to reduce API calls
  - Handle users not found in Slack

** Sprint 2 Testing Checkpoint** `@prabel`
- [ ] **Test: Status Update Sync**
  1. Create incident via `/incident`
  2. Go to Notion, change Status from "New" to "In Progress"
  3. Wait up to 5 minutes (or restart sync manually)
  4.  Verify: Update message posted in Slack thread
  5.  Verify: Message says "Status changed to In Progress"

- [ ] **Test: Owner Assignment Sync**
  1. In Notion, assign yourself as Owner
  2. Wait for sync
  3.  Verify: Message in Slack: "Owner assigned: @YourName"
  4.  Verify: Slack mention is clickable

- [ ] **Test: Multiple Changes**
  1. Change both Status and Owner in Notion
  2. Wait for sync
  3.  Verify: Single update message with both changes

- [ ] **Test: Manual Notion Incident**
  1. Create incident directly in Notion (not via Slack)
  2. Set CreatedFrom = "Manual"
  3. Change Status in Notion
  4.  Verify: No Slack update (since no thread exists)
  5.  Verify: No errors in logs

---

## > Sprint 3: Automation & Reminders

### Daily Digest
- [ ] **Create unassigned incident fetcher** `@dev`
  - File: `src/notion/queries/unassignedIncidents.ts`
  - Query Notion for incidents where Owner is empty
  - Filter by Status: "New" or "In Progress"
  - Sort by Created At (oldest first)

- [ ] **Create digest message formatter** `@dev`
  - File: `src/slack/messages/dailyDigest.ts`
  - Format list of unassigned incidents
  - Include: Title, Severity, Days since creation
  - Add link to each Notion page
  - If no incidents: " All incidents have owners!"

- [ ] **Configure target Slack channel** `@prabel` ='
  - Decide which channel receives daily digest
  - Add to `.env`: `SLACK_DIGEST_CHANNEL_ID`
  - Invite bot to that channel

- [ ] **Implement digest scheduler** `@dev`
  - File: `src/services/dailyDigest.ts`
  - Use `node-cron` to run daily at 9:00 AM
  - Fetch unassigned incidents
  - Post digest to configured channel
  - Log digest sends

### Postmortem Reminder
- [ ] **Create resolved incident tracker** `@dev`
  - File: `src/notion/queries/recentlyResolved.ts`
  - Query incidents resolved in last 24 hours
  - Check if Postmortem field is empty
  - Return list needing reminders

- [ ] **Create postmortem reminder message** `@dev`
  - File: `src/slack/messages/postmortemReminder.ts`
  - Format: "=� Reminder: Please add postmortem for incident: [Title]"
  - Mention Owner and Accountable
  - Include link to Notion page

- [ ] **Configure Notion Postmortem field** `@prabel` ='
  - Add "Postmortem" property to Notion database
  - Type: Rich text or separate Notion page
  - Optional field

- [ ] **Implement postmortem reminder scheduler** `@dev`
  - File: `src/services/postmortemReminder.ts`
  - Run daily at 10:00 AM (after digest)
  - Check resolved incidents from yesterday
  - Post reminder to original Slack thread
  - Mark reminder as sent (add "Reminder Sent" property in Notion)

### Deployment Preparation
- [ ] **Add deployment configuration** `@dev`
  - Create `vercel.json` or `render.yaml`
  - Configure build command: `npm run build`
  - Configure start command: `npm start`
  - Set Node.js version

- [ ] **Set up environment variables on hosting** `@prabel` ='
  - Copy all vars from `.env` to Vercel/Render dashboard
  - Test connection to Slack and Notion from production

- [ ] **⚠️  IMPORTANT: Update Slack App URLs after deployment** `@prabel` ='
  - Go to https://api.slack.com/apps → Incident Bot
  - Update **Slash Commands** → `/incident`:
    - Change Request URL from ngrok to: `https://your-production-domain.com/slack/events`
  - Update **Interactivity & Shortcuts**:
    - Change Request URL from ngrok to: `https://your-production-domain.com/slack/events`
  - Click "Save Changes" for both
  - ⚠️  Current ngrok URL will stop working after deployment!
  - Test `/incident` command in Slack after URL update

- [ ] **Configure health checks** `@dev`
  - Ensure `/health` endpoint returns proper status
  - Add checks for: Slack client ready, Notion client ready
  - Return 503 if not ready

** Sprint 3 Testing Checkpoint** `@prabel`
- [ ] **Test: Daily Digest**
  1. Create 2-3 incidents without assigning Owner
  2. Manually trigger digest (or wait for scheduled time)
  3.  Verify: Message posted in configured channel
  4.  Verify: All unassigned incidents listed
  5.  Verify: Links to Notion work

- [ ] **Test: Digest Empty State**
  1. Assign owners to all incidents
  2. Run digest
  3.  Verify: Message says "All incidents have owners"

- [ ] **Test: Postmortem Reminder**
  1. Create incident, set Status to "Resolved"
  2. Wait 24 hours (or manually trigger check)
  3.  Verify: Reminder posted in original Slack thread
  4.  Verify: Owner mentioned in reminder

- [ ] **Test: Production Deployment**
  1. Deploy to Vercel/Render
  2.  Verify: `/health` endpoint returns 200
  3.  Verify: `/incident` command works in Slack
  4.  Verify: Sync and schedulers running
  5.  Verify: Logs show no errors

---

## <� Sprint 4: Polish & Refinements (Optional)

### User Experience Improvements
- [ ] **Improve error messages** `@dev`
  - User-friendly messages for common failures
  - Add troubleshooting tips
  - Link to documentation

- [ ] **Add incident templates** `@dev`
  - Pre-fill common incident types in modal
  - Save time for frequent reporters

- [ ] **Enhance Slack messages with formatting** `@dev`
  - Use Slack Block Kit for richer updates
  - Add colors based on severity
  - Add action buttons (e.g., "View in Notion")

### Monitoring & Observability
- [ ] **Add application metrics** `@dev`
  - Track: incidents created, sync runs, digest sends
  - Use simple logging or integrate with monitoring service

- [ ] **Set up error alerts** `@prabel` ='
  - Configure alerts for repeated failures
  - Email or Slack notifications on critical errors

### Documentation Updates
- [ ] **Update README with setup instructions** `@dev`
  - Complete installation guide
  - Environment variable descriptions
  - Deployment guide

- [ ] **Create user guide** `@dev`
  - How to report incident
  - How to manage incidents in Notion
  - Best practices

** Sprint 4 Testing Checkpoint** `@prabel`
- [ ] Full end-to-end test of all features
- [ ] Gather feedback from 2-3 team members
- [ ] Document any issues or feature requests

---

## =� Definition of Done (per Sprint)

**Sprint 0:**
 Project structure created
 Environment configured
 Server runs successfully
 Slack and Notion integrations connected

**Sprint 1:**
 `/incident` command creates incidents in Notion
 Confirmation posted to Slack thread
 All data correctly synced
 Error handling in place

**Sprint 2:**
 Changes in Notion Status/Owner trigger Slack updates
 Updates posted in correct thread
 No duplicate or missed updates
 Manual Notion incidents handled gracefully

**Sprint 3:**
 Daily digest posted to channel
 Postmortem reminders sent after 24h
 Application deployed to production
 All schedulers running

**Sprint 4:**
 Polish items completed
 Documentation updated
 Team feedback collected
 Ready for 2-month pilot

---

## = Legend

- `@dev` - Development task (Claude Code will implement)
- `@prabel` =' - Requires manual action from you (configuration, credentials, testing)
-  - Testing checkpoint (clear test scenarios with expected results)

---

## � Estimated Timeline

- **Sprint 0:** 1-2 days (mostly setup)
- **Sprint 1:** 3-4 days (core functionality)
- **Sprint 2:** 2-3 days (sync logic)
- **Sprint 3:** 2-3 days (automation)
- **Sprint 4:** 1-2 days (polish)

**Total:** ~2 weeks for MVP (Sprints 0-3)

---

## =� Next Steps

1. Review this TODO.md
2. Start with Sprint 0 tasks
3. Complete `@prabel` tasks (Slack app, Notion setup, env vars)
4. Let me know when ready to start development
5. I'll implement `@dev` tasks sprint by sprint
6. You test at each checkpoint 

Ready to start Sprint 0? =�


**Sprint 1 Status: ✅ DEVELOPMENT COMPLETE (2025-11-03)**
- All core functionality implemented and working
- Server running on localhost:3000
- ngrok tunnel active: https://sluggish-krystyna-transstellar.ngrok-free.dev
- Slack integration: ✅ Connected
- Notion integration: ✅ Connected and aligned with NOTION_DATABASE.md schema
- Ready for testing checkpoint


**Sprint 1.5 Status: ✅ COMPLETE (2025-11-03)**
- Description now appears in Notion page body with rich text support
- Added "Description" heading in page content
- Property description truncated to 2000 chars for quick reference
- Fixed Slack thread URL to use app_redirect (no team:read scope needed)
