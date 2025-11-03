# 💡 Project Overview — Incident Bot (Slack ↔ Notion Integration)

## 🧭 Purpose

Appunite needs a more structured, transparent way to handle service-related incidents — across delivery, communication, and collaboration.

Currently, incidents are discussed in Slack threads, DMs, and meetings without a central source of truth.  
This leads to frustration, lost context, duplicated work, and delayed resolutions.

**Incident Bot** aims to fix that by creating one consistent workflow for incident management:
- Quick reporting directly from Slack.
- Central tracking in Notion.
- Automated reminders and visibility for accountability.

---

## 🎯 Goals

| Goal | Description |
|------|-------------|
| **Simplify reporting** | Anyone can log an incident directly from Slack using `/incident`. |
| **Centralize knowledge** | All incidents automatically appear in the Notion “Incidents” database. |
| **Increase accountability** | Every incident has an Owner and Accountable role; reminders ensure follow-up. |
| **Promote blameless culture** | Incidents are seen as process improvement opportunities, not personal failures. |
| **Enable insights** | Over time, Notion data will reveal systemic issues and recurring themes. |

---

## 👥 Target Users

| Role | Motivation |
|------|-------------|
| **Individual Contributor (IC)** | Needs a fast, safe way to report problems without hierarchy friction. |
| **Team Lead (TL)** | Wants visibility into service issues affecting delivery or morale. |
| **Account Success Manager (ASM)** | Uses incident data to manage client expectations and communication. |
| **Service Delivery Manager (SDM)** | Oversees reliability and ensures incidents are followed through. |
| **Heads / Leadership** | Needs aggregated visibility and postmortem data to guide strategic improvements. |

---

## 🧱 Core Features (MVP)

| Feature | Description |
|----------|-------------|
| **Slash Command `/incident`** | Opens a modal in Slack for structured incident submission. |
| **Notion Sync** | Automatically creates a page in Notion’s “Incidents” database. |
| **Slack Thread Confirmation** | Bot posts a confirmation message (and later, updates) in the same Slack thread. |
| **Daily Digest** | A daily Slack message listing unassigned incidents. |
| **Postmortem Reminder** | After 24h of resolving an incident, sends reminder to fill postmortem section. |

---

## 🔁 Extended Features (Phase 2)

| Area | Potential features |
|------|--------------------|
| **Automation** | Auto-detect missing client updates, stale projects, or unassigned tasks. |
| **AI** | Summarize incident threads, detect categories, suggest resolution patterns. |
| **Analytics** | Dashboards in Notion showing frequency, categories, and root causes. |

---

## ⚙️ Tech Overview

| Component | Description |
|------------|-------------|
| **Slack Layer** | Slash commands, modals, thread updates (via `@slack/bolt`). |
| **Backend** | Node.js + TypeScript app exposing `/slack/events` and cron jobs. |
| **Notion Layer** | `@notionhq/client` SDK; Notion acts as source of truth. |
| **Storage** | No external DB — all persistent data in Notion. |
| **Deployment** | Vercel / Render / Fly.io serverless app. |

---

## 🚀 Success Criteria

✅ MVP working in production within Appunite workspace.  
✅ Team members successfully log incidents via Slack.  
✅ Notion shows all incidents with correct properties.  
✅ Daily digest and reminder jobs running automatically.  
✅ Positive feedback after 2-month pilot (reduced chaos, better visibility).

---

## 📅 Pilot & Validation

**Pilot period:** 2 months  
**Success indicators:**
- Increased number of logged incidents.
- Clear ownership and faster resolution.
- Improved communication between SD / ASM / TL.

At the end of the pilot:
- Decide on Go / No-Go for full rollout.
- Refine definitions, automation rules, and Notion schema.

---

## 🧩 Related Documentation
- [Architecture](ARCHITECTURE.md)
- [Incident Flow](INCIDENT_FLOW.md)
- [API Reference](API_REFERENCE.md)
- [TODO / Roadmap](TODO.md)

---

## 🧠 Notes for Claude Code
When generating code or task plans:
- Follow architecture defined in `ARCHITECTURE.md`
- Align behavior with `INCIDENT_FLOW.md`
- Use Notion as the only database
- Treat Slack as the main interaction layer
- Default tone for bot messages: *neutral, factual, human*

