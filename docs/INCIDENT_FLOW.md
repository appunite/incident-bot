# 🧾 Incident Flow

## Manual Incident Creation (via Slack)
1. User runs `/incident`
2. Modal collects Title, Description, Severity, Area
3. On submit: create record in Notion, set metadata, post confirmation.

## Manual Incident Creation (via Notion Form)
- CreatedFrom = "Manual"
- Slack fields empty.

## Two-Way Sync
- Poll Notion for updated incidents.
- If Status/Owner changes → post Slack thread update.

## Daily Digest
- Once daily: post a Slack digest with two sections:
  - Unassigned incidents.
  - Stale incidents (not updated for too long).
- Staleness source: Notion page `last_edited_time`.
- Thresholds:
  - `Open`: 7 days without updates
  - `Ready for Review`: 7 days without updates
  - `In Progress`: 28 days without updates
- Stale section owner display:
  - Best effort Slack mention by owner email
  - Fallback to Notion owner name
  - Fallback to `Unassigned`

## Postmortem Reminder
- 24h after resolving: reminder to fill Postmortem section.
