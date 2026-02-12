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
| `getDigestIncidents()` | `/src/notion/queries/unassignedIncidents.ts` | Fetches Open/In Progress/Ready for Review incidents for daily digest |

## Daily Digest Service
| Function | File | Description |
|-----------|------|-------------|
| `sendDailyDigest()` | `/src/services/dailyDigest.ts` | Classifies incidents into unassigned + stale and posts digest to Slack |
| `startDailyDigestScheduler()` | `/src/services/dailyDigest.ts` | Starts weekday 9:00 cron schedule (`0 9 * * 1-5`) |
| `createDailyDigestMessage()` | `/src/slack/messages/dailyDigest.ts` | Builds Slack blocks for unassigned and stale digest sections |

## Digest Data Shape
`getDigestIncidents()` returns incidents with:
- identity: `id`, `url`, `title`
- classification: `severity`, `status`, `area`
- freshness: `daysSinceCreation`, `lastEditedTime`, `daysSinceLastUpdate`
- ownership: `ownerNotionId`, `ownerName`, `ownerEmail`
- teams: `teamIds`

Stale thresholds (hardcoded):
- `Open`: 7 days
- `Ready for Review`: 7 days
- `In Progress`: 28 days
