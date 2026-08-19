# Slack App Scopes Setup

## Missing Scope: `users:read.email`

### Issue
The Slack bot currently cannot access user email addresses, which prevents the Reporter field from being automatically assigned in Notion.

**Current scopes:**
- `chat:write`
- `commands`
- `users:read`

**Required scope:**
- `users:read.email` - Needed to access `userInfo.user.profile.email`

### How to Add the Scope

1. Go to https://api.slack.com/apps
2. Select your "Incident Bot" app
3. Navigate to **OAuth & Permissions** in the left sidebar
4. Scroll down to **Scopes** section
5. Under **Bot Token Scopes**, click **Add an OAuth Scope**
6. Add `users:read.email`
7. Scroll to the top and click **Reinstall to Workspace**
8. Approve the new permission

### After Adding the Scope

Once the `users:read.email` scope is added and the app is reinstalled, the bot will be able to:
- Access user email addresses from Slack
- Match Slack users to Notion users by email
- Automatically assign the Reporter field in the Incidents database

The Reporter assignment will work automatically without any code changes.

## Alternative Approaches (If Email Access Not Available)

If email access cannot be enabled, alternative matching strategies could be:
1. Match by name (Slack display name → Notion user name)
2. Manual Reporter assignment in Notion
3. Store Slack user ID in a custom Notion property for mapping

---

## Thread Messages Feature

### Required Scopes

To fetch thread messages when reporting incidents from threaded conversations, the following scopes are required:

**Current scopes:**
- `chat:write`
- `commands`
- `users:read`
- `users:read.email`

**Additional scopes for thread messages:**
- `channels:history` - Access message history in public channels
- `groups:history` - Access message history in private channels

### How to Add These Scopes

1. Go to https://api.slack.com/apps
2. Select your "Incident Bot" app
3. Navigate to **OAuth & Permissions** in the left sidebar
4. Scroll down to **Scopes** section
5. Under **Bot Token Scopes**, add both:
   - `channels:history`
   - `groups:history`
6. Scroll to the top and click **Reinstall to Workspace**
7. Approve the new permissions

### After Adding the Scopes

The bot will be able to:
- Fetch all messages from threads when creating incidents from threaded messages
- Include thread context in Notion incident pages under the "What Happened" section
- Provide complete conversation history for better incident understanding

Thread messages are displayed in a collapsible toggle block, showing:
- User name and timestamp for each message
- Message content
- Total message count

### Privacy Considerations

These scopes grant the bot access to message history in channels where it's invited. Important notes:

- The bot **only fetches messages** when explicitly creating an incident from that thread
- Thread messages are **only stored** in the associated Notion incident page
- No message content is stored in the bot's database
- Thread fetching only occurs on user action (reporting an incident)

### Feature Behavior

**When thread messages are captured:**
- User reports an incident using "Report as Incident" message shortcut
- The message is part of a thread (has replies)
- Bot fetches up to 30 thread messages (excluding the parent message)
- Thread messages are added to the Notion page in a toggle block titled "💬 Thread Context (N messages)"

**When thread messages are not captured:**
- Incident reported using `/incident` command (not from a message)
- Message is standalone (not part of a thread)
- Thread fetch fails (gracefully continues without thread context)
- Bot lacks the required scopes (logs warning, continues without thread context)

---

## Triage User Group (`@incident-triage`)

The new-incident notification posted to the digest channel mentions a Slack user group,
so every new report lands on a named group instead of nobody in particular.

The scheduled daily digest does **not** mention the group — it is a recurring summary,
not a new report, and pinging a group every weekday turns the mention into noise.

### Creating the Group

1. In Slack, go to **People & user groups** → **User groups** → **Create a user group**.
2. Name: `Incident Triage`, handle: `incident-triage`.
3. Add the people responsible for triage (SD / Accounts / Heads).
4. Optionally set the group's default channel to `#shit-happens-notifications`.

> User groups require a paid Slack plan. Without one, use an env-configured channel
> mention or a plain list of users instead.

### Finding the Group ID

The bot mentions the group by ID (`S…`), not by handle, so renaming the handle does
not break the mention.

Call `usergroups.list` with a token that has the `usergroups:read` scope and read the
`id` field of the entry whose `handle` is `incident-triage`:

```bash
curl -s -H "Authorization: Bearer $SLACK_BOT_TOKEN" https://slack.com/api/usergroups.list
```

Then set it in the deployment environment:

```
SLACK_TRIAGE_GROUP_ID=S01234ABCDE
```

> This repository is public. Do not commit real workspace IDs - keep them in the
> deployment environment and use placeholders in `.env.example` and docs.

### Scopes

- Posting a group mention needs **no extra scope** — `chat:write` is enough, because the
  mention is plain `<!subteam^ID>` markup in the message text.
- `usergroups:read` is only needed for the one-off lookup above, and can be removed afterwards.

### Behavior

- No `SLACK_TRIAGE_GROUP_ID` set → the notification is posted exactly as before, without a mention.
- No `SLACK_DIGEST_CHANNEL_ID` set → no digest-channel messages are sent at all, so the
  mention never fires.
- Daily digest → never mentions the group, regardless of configuration.
