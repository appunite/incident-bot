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
