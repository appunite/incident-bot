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
- Once daily: list incidents without owner in Slack.

## Postmortem Reminder
- 24h after resolving: reminder to fill Postmortem section.
