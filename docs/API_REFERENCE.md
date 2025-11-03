# ⚙️ API Reference — Slack & Notion Integration

## Slack Bolt Handlers
| Method | Description |
|---------|--------------|
| `app.command("/incident")` | Opens the incident creation modal |
| `app.view("incident_modal")` | Handles form submission |
| `app.client.chat.postMessage()` | Sends Slack thread updates |

## Notion Methods
| Function | File | Description |
|-----------|------|-------------|
| `createIncident()` | `/src/notion/createIncident.ts` | Creates a new page in Notion DB |
| `updateIncident()` | `/src/notion/updateIncident.ts` | Updates existing incident |
| `fetchRecentUpdates()` | `/src/notion/syncWatcher.ts` | Polls for last edited pages |
