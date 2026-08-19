# 🧩 Architecture Overview

## High-Level Design

```
Slack User → `/incident` Command
       ↓
Slack Modal (form)
       ↓
Incident Bot (Node.js)
       ↓
Notion Database (Incidents)
       ↓
↕ Periodic Sync (Notion ↔ Slack thread updates)
```

## Components

### 1. Slack Layer
- Implemented with `@slack/bolt`.
- Handles slash commands, modal views, thread messages, and notifications.
- Mentions the triage user group from `SLACK_TRIAGE_GROUP_ID` in the new-incident notification, so every new report has a named group expected to triage it. The scheduled daily digest is deliberately left without a mention.

### 2. Notion Layer
- Uses `@notionhq/client`.
- Responsible for creating/updating incidents and syncing properties.

### 3. Sync Layer
- Polls Notion every few minutes, compares state, and posts Slack updates.

### 4. Scheduler
- Posts daily digest to Slack channel with unassigned incidents.

### 5. Hosting
- Node.js app on Render / Vercel.
