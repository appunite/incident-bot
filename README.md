# 🚨 Incident Bot (Slack ↔ Notion Integration)

Incident Bot is a Slack + Notion integration designed to simplify how Appunite logs, tracks, and resolves service-related incidents.

## 💡 Purpose
Enable users to create incidents directly from Slack via `/incident`, automatically syncing with the Notion `Incidents` database.

## ⚙️ Core Features
- `/incident` command opens a Slack modal for structured reporting.
- Data automatically pushed to Notion database.
- Thread message in Slack confirming creation.
- Two-way sync: status/owner updates in Notion reflect back to Slack thread.
- Daily reminders for incidents without owner.

## 🧱 Tech Stack
- Node.js + TypeScript
- Slack Bolt SDK
- Notion API
- Express server
- Deployed on Railway (see [DEPLOYMENT.md](docs/DEPLOYMENT.md))

## 📂 Structure
- `src/slack/` → Slack handlers (commands, modals, events)
- `src/notion/` → Notion API clients and helpers
- `src/utils/` → logging, error handling
- `docs/` → architecture & behavior documentation

## 🧠 Environment Variables
| Variable | Description |
|-----------|--------------|
| `SLACK_BOT_TOKEN` | OAuth token from Slack app |
| `SLACK_SIGNING_SECRET` | Secret from Slack app |
| `NOTION_TOKEN` | Notion integration token |
| `NOTION_DB_ID` | ID of the Incidents database |
| `PORT` | Local port for dev (default 3000) |

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Slack workspace with admin access
- Notion workspace with admin access

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```
Then edit `.env` with your credentials (see next section)

3. **Run the development server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 🔑 Configuration (Required)

You need to configure both Slack and Notion integrations before the bot will work.

#### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: `Incident Bot`, select your workspace
4. Go to **OAuth & Permissions**:
   - Add Bot Token Scopes:
     - `chat:write` - Post messages
     - `commands` - Use slash commands
     - `users:read` - Read user info
     - `channels:read` - Read channel info
   - Click "Install to Workspace"
   - Copy **Bot User OAuth Token** → `SLACK_BOT_TOKEN` in `.env`
5. Go to **Basic Information**:
   - Copy **Signing Secret** → `SLACK_SIGNING_SECRET` in `.env`

#### 2. Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: `Incident Bot`, select workspace
4. Copy **Internal Integration Token** → `NOTION_TOKEN` in `.env`
5. Create a new database in Notion called "Incidents"
6. Share the database with your integration (click "Share" → find your integration)
7. Copy database ID from URL:
   - URL format: `https://www.notion.so/{workspace}/{DATABASE_ID}?v=...`
   - Copy `DATABASE_ID` → `NOTION_DB_ID` in `.env`

#### 3. Configure Notion Database Properties

Add these properties to your "Incidents" database:

| Property Name | Type | Options |
|--------------|------|---------|
| Title | Title | (default) |
| Description | Rich Text | - |
| Status | Select | New, In Progress, Resolved, Closed |
| Severity | Select | Critical, High, Medium, Low |
| Area | Select | Client Communication, Internal Process, Technical, Other |
| Owner | Person | - |
| Accountable | Person | - |
| Created At | Date | - |
| Created By | Rich Text | - |
| Created From | Select | Slack, Manual |
| Slack Thread URL | URL | - |
| Slack Channel ID | Rich Text | - |
| Slack Message TS | Rich Text | - |

### ✅ Verify Installation

1. Start the server: `npm run dev`
2. Visit http://localhost:3000/health
3. You should see: `{"status":"healthy","slack":{"connected":true},"notion":{"connected":true}}`

If you see errors, check your `.env` configuration.

## 📝 Next Steps

After setup is complete, see [docs/TODO.md](docs/TODO.md) for the development roadmap.

**Sprint 1** will implement the `/incident` command and basic incident creation flow.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
