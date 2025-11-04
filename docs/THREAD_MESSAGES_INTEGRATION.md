# Thread Messages Integration - Technical Design

## Overview

This document outlines the design for integrating Slack thread messages into Notion incident pages. When an incident is created from a message that's part of a thread, all thread messages will be captured and added to the Notion page for additional context.

---

## Use Case

**Current behavior:**
When a user reports an incident using the "Report as Incident" message shortcut, only the selected message text is captured in the incident description.

**Desired behavior:**
If the message is part of a thread, capture all thread messages and include them in the Notion incident page under the "What Happened" section for complete context.

**Example scenario:**
```
User A: "Payment gateway is timing out"
  ├─ User B: "Same issue here, affecting checkout flow"
  ├─ User C: "Checked logs - seeing 503 errors from Stripe"
  └─ User D: "This is impacting VIO project customers"

[User clicks "Report as Incident" on User A's message]
→ Incident created with all 4 messages captured as context
```

---

## Slack API Research

### conversations.replies Method

**Documentation:** https://docs.slack.dev/reference/methods/conversations.replies

**Required Parameters:**
- `channel` (string): The conversation ID (e.g., "C1234567890")
- `ts` (string): Timestamp of the thread parent message (e.g., "1234567890.123456")

**Optional Parameters:**
- `cursor` (string): Pagination cursor for fetching additional messages
- `limit` (number): Number of messages to return (default 100, max 1000)
- `oldest` (string): Only messages after this timestamp (inclusive if `inclusive=true`)
- `latest` (string): Only messages before this timestamp (inclusive if `inclusive=true`)
- `inclusive` (boolean): Include messages matching `oldest` and `latest` timestamps

**Response Format:**
```typescript
{
  ok: true,
  messages: [
    {
      type: "message",
      user: "U1234567890",
      text: "Payment gateway is timing out",
      ts: "1234567890.123456",
      thread_ts: "1234567890.123456",  // Same as ts for parent
      reply_count: 3,
      reply_users: ["U1234567890", "U0987654321"]
    },
    {
      type: "message",
      user: "U0987654321",
      text: "Same issue here",
      ts: "1234567891.123457",
      thread_ts: "1234567890.123456",  // Parent thread timestamp
      parent_user_id: "U1234567890"
    }
    // ... more messages
  ],
  has_more: false,
  response_metadata: {
    next_cursor: ""
  }
}
```

**Required OAuth Scopes:**

Bot token scopes needed:
- `channels:history` - Access public channel message history
- `groups:history` - Access private channel message history

**Current bot scopes:** `chat:write`, `commands`, `users:read`, `users:read.email`
**Missing scopes:** `channels:history`, `groups:history`

**Rate Limits:**
- Non-Marketplace apps: 1 request per minute, max 15 objects per request
- Marketplace/internal apps: Tier 3 rate limits (higher)

**Important Notes:**
- Returns parent message as first item even if it has no replies
- Maximum 1,000 messages per request with pagination support
- `reply_users` may contain bot IDs as fallback
- Cannot thread `channel_leave` or `channel_join` message subtypes

---

## Current Implementation Analysis

### Message Action Flow

**File:** `src/slack/actions/reportMessage.ts:28-48`

Current implementation captures thread context:
```typescript
const message = shortcut.message;
const channelId = shortcut.channel.id;
const messageTs = message.ts;
const threadTs = message.thread_ts || messageTs;

const privateMetadata = JSON.stringify({
  sourceChannelId: channelId,
  sourceMessageTs: messageTs,
  sourceThreadTs: threadTs,
});
```

Key observations:
- ✅ Already captures `threadTs` for thread parent
- ✅ Falls back to `messageTs` if not in a thread
- ✅ Passes context via `privateMetadata` to modal submission
- ❌ Does not fetch thread messages

### Incident Submission Flow

**File:** `src/slack/handlers/incidentSubmission.ts:70-88`

Current implementation parses metadata:
```typescript
let sourceChannelId: string | undefined;
let sourceMessageTs: string | undefined;
let sourceThreadTs: string | undefined;

if (privateMetadata) {
  const metadata = JSON.parse(privateMetadata);
  sourceChannelId = metadata.sourceChannelId;
  sourceMessageTs = metadata.sourceMessageTs;
  sourceThreadTs = metadata.sourceThreadTs;
}
```

Key observations:
- ✅ Retrieves thread context from `privateMetadata`
- ✅ Has all information needed to call `conversations.replies`
- ❌ Does not fetch thread messages
- ❌ Only uses `sourceThreadTs` for constructing Slack message URL

### Notion Page Template

**File:** `src/notion/pageTemplate.ts:20-60`

Current "What Happened" section:
```typescript
blocks.push({
  object: 'block',
  type: 'heading_1',
  heading_1: {
    rich_text: [{ type: 'text', text: { content: '🧠 What Happened' } }],
  },
});

blocks.push({
  object: 'block',
  type: 'quote',
  quote: {
    rich_text: [{
      type: 'text',
      text: {
        content: 'A short, factual summary of what occurred...',
      },
      annotations: { italic: true, color: 'gray' },
    }],
  },
});

blocks.push({
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: [{ type: 'text', text: { content: data.description } }],
  },
});
```

Key observations:
- ✅ Clear section structure for adding thread context
- ✅ Uses Notion block types (heading, quote, paragraph)
- ❌ No thread messages included
- 💡 Perfect place to add toggle block after description

---

## Design Options

### Option A: Inline Thread Messages as Quoted Blocks

**Description:** Add each thread message as a separate quote block directly in the "What Happened" section.

**Notion Structure:**
```
🧠 What Happened
[Description paragraph]

💬 Thread Context
> User A • 2:30 PM
> Payment gateway is timing out

> User B • 2:31 PM
> Same issue here, affecting checkout flow

> User C • 2:32 PM
> Checked logs - seeing 503 errors from Stripe
```

**Pros:**
- ✅ Simplest to implement
- ✅ All context immediately visible
- ✅ Good for short threads (5-10 messages)
- ✅ Easy to scan and read

**Cons:**
- ❌ Makes page very long for large threads
- ❌ No way to collapse/hide
- ❌ Can overwhelm page structure
- ❌ Not scalable for 50+ message threads

**Implementation complexity:** Low

---

### Option B: Collapsible Toggle Block (RECOMMENDED)

**Description:** Add thread messages inside a toggle block that can be expanded/collapsed by the user.

**Notion Structure:**
```
🧠 What Happened
[Description paragraph]

▶ 💬 Thread Context (12 messages)
  └─ [Collapsed by default, click to expand]
     > User A • 2:30 PM: Payment gateway is timing out
     > User B • 2:31 PM: Same issue here
     > User C • 2:32 PM: Checked logs - 503 errors
     ... (9 more messages)
```

**Pros:**
- ✅ Keeps page clean by default
- ✅ User decides when to view context
- ✅ Handles long threads elegantly
- ✅ Good balance of accessibility and organization
- ✅ Message count visible without expanding

**Cons:**
- ⚠️ Slightly more complex implementation (toggle block)
- ⚠️ Context hidden by default (trade-off)

**Implementation complexity:** Medium

**Why recommended:**
This approach provides the best balance between accessibility and page organization. It works well for both short threads (3-5 messages) and long threads (50+ messages), while keeping the main incident details prominent.

---

### Option C: Child/Subpage for Thread

**Description:** Create a separate child page containing all thread messages, linked from the main incident page.

**Notion Structure:**
```
🧠 What Happened
[Description paragraph]

📄 View Thread Context (12 messages) → [Link to child page]

[Child page structure:]
Title: Thread Context for "Payment Issues"
- All messages formatted with timestamps
- Organized chronologically
```

**Pros:**
- ✅ Completely separate from main page
- ✅ Best for very long threads (100+ messages)
- ✅ Can have custom structure and formatting
- ✅ Doesn't clutter main incident page at all

**Cons:**
- ❌ Most complex to implement
- ❌ Requires extra click to view
- ❌ Might be overkill for short threads
- ❌ Less discoverable
- ❌ Creates orphaned pages if incident deleted

**Implementation complexity:** High

---

### Hybrid Approach (Advanced)

Use different options based on thread length:
- **Short threads (1-10 messages):** Option A (inline quotes)
- **Medium threads (11-30 messages):** Option B (toggle block)
- **Long threads (31+ messages):** Option C (child page)

**Pros:**
- ✅ Optimal UX for each scenario
- ✅ Handles all edge cases

**Cons:**
- ❌ Most complex implementation
- ❌ Inconsistent user experience
- ❌ More code to maintain

---

## Recommended Implementation: Option B (Toggle Block)

### Architecture

**New file:** `src/slack/fetchThreadMessages.ts`
```typescript
interface ThreadMessage {
  user: string;
  userName: string;
  text: string;
  timestamp: string;
  formattedTime: string;
}

interface ThreadMessagesResult {
  messages: ThreadMessage[];
  totalCount: number;
  hasMore: boolean;
}

export async function fetchThreadMessages(
  channelId: string,
  threadTs: string,
  limit?: number
): Promise<ThreadMessagesResult | null>
```

**Modified file:** `src/slack/handlers/incidentSubmission.ts`
```typescript
// After parsing privateMetadata
let threadMessages: ThreadMessage[] | undefined;

if (sourceChannelId && sourceThreadTs) {
  const threadResult = await fetchThreadMessages(
    sourceChannelId,
    sourceThreadTs,
    30  // Fetch max 30 messages
  );

  if (threadResult && threadResult.messages.length > 0) {
    threadMessages = threadResult.messages;
  }
}

// Pass to createIncident
const result = await createIncident(incidentData, threadMessages);
```

**Modified file:** `src/notion/pageTemplate.ts`
```typescript
export function buildIncidentPageBlocks(
  data: IncidentFormData,
  threadMessages?: ThreadMessage[]
): BlockObjectRequest[]
```

**Modified file:** `src/notion/createIncident.ts`
```typescript
export async function createIncident(
  data: IncidentFormData,
  threadMessages?: ThreadMessage[]
): Promise<CreateIncidentResult>
```

**Modified file:** `src/types/incident.ts`
```typescript
export interface ThreadMessage {
  user: string;           // Slack user ID
  userName: string;       // Display name
  text: string;          // Message text
  timestamp: string;     // Raw timestamp (ts)
  formattedTime: string; // Human-readable time
}
```

---

## Implementation Details

### Step 1: Add Slack Scopes

**Action required:** Update Slack app OAuth scopes

Add to Bot Token Scopes:
- `channels:history`
- `groups:history`

**Process:**
1. Go to https://api.slack.com/apps
2. Select "Incident Bot" app
3. Navigate to OAuth & Permissions
4. Add both scopes under "Bot Token Scopes"
5. Reinstall app to workspace
6. Approve new permissions

**Update documentation:** `docs/SLACK_SCOPES_SETUP.md`

---

### Step 2: Create Thread Fetching Function

**File:** `src/slack/fetchThreadMessages.ts`

```typescript
import { WebClient } from '@slack/web-api';
import { logger } from '../utils/logger';

export interface ThreadMessage {
  user: string;
  userName: string;
  text: string;
  timestamp: string;
  formattedTime: string;
}

export interface ThreadMessagesResult {
  messages: ThreadMessage[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Fetches all messages from a Slack thread
 * @param channelId - Slack channel ID
 * @param threadTs - Thread parent timestamp
 * @param limit - Maximum number of messages to fetch (default 30)
 * @returns Thread messages with formatted user info, or null if error
 */
export async function fetchThreadMessages(
  client: WebClient,
  channelId: string,
  threadTs: string,
  limit: number = 30
): Promise<ThreadMessagesResult | null> {
  try {
    logger.info('Fetching thread messages', {
      channelId,
      threadTs,
      limit,
    });

    const response = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      limit,
    });

    if (!response.ok || !response.messages) {
      logger.error('Failed to fetch thread messages', {
        error: response.error,
      });
      return null;
    }

    const messages = response.messages;

    // Skip the first message (parent) since it's already in description
    const threadReplies = messages.slice(1);

    // Format messages with user info
    const formattedMessages: ThreadMessage[] = await Promise.all(
      threadReplies.map(async (msg) => {
        // Fetch user info for display name
        let userName = 'Unknown User';
        if (msg.user) {
          try {
            const userInfo = await client.users.info({ user: msg.user });
            userName = userInfo.user?.profile?.display_name ||
                      userInfo.user?.real_name ||
                      'Unknown User';
          } catch (error) {
            logger.warn('Failed to fetch user info', {
              userId: msg.user,
              error,
            });
          }
        }

        // Format timestamp as readable time
        const timestamp = msg.ts || '';
        const date = new Date(parseFloat(timestamp) * 1000);
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return {
          user: msg.user || 'unknown',
          userName,
          text: msg.text || '',
          timestamp,
          formattedTime,
        };
      })
    );

    logger.info('Successfully fetched thread messages', {
      totalMessages: formattedMessages.length,
      hasMore: response.has_more || false,
    });

    return {
      messages: formattedMessages,
      totalCount: formattedMessages.length,
      hasMore: response.has_more || false,
    };
  } catch (error) {
    logger.error('Error fetching thread messages', {
      error,
      channelId,
      threadTs,
    });
    return null;
  }
}
```

**Key features:**
- Fetches thread messages via `conversations.replies`
- Skips parent message (already in description)
- Resolves user display names
- Formats timestamps as readable times
- Handles errors gracefully (returns null)
- Respects message limit to avoid rate limits

---

### Step 3: Update Incident Submission Handler

**File:** `src/slack/handlers/incidentSubmission.ts`

Add after parsing `privateMetadata` (around line 88):

```typescript
// Fetch thread messages if available
let threadMessages: ThreadMessage[] | undefined;

if (sourceChannelId && sourceThreadTs) {
  logger.info('Attempting to fetch thread messages', {
    sourceChannelId,
    sourceThreadTs,
  });

  const threadResult = await fetchThreadMessages(
    client,
    sourceChannelId,
    sourceThreadTs,
    30  // Limit to 30 messages to avoid performance issues
  );

  if (threadResult && threadResult.messages.length > 0) {
    threadMessages = threadResult.messages;
    logger.info('Thread messages fetched successfully', {
      messageCount: threadResult.messages.length,
      hasMore: threadResult.hasMore,
    });
  }
}
```

Update the `createIncident` call (around line 150):

```typescript
const result = await createIncident(incidentData, threadMessages);
```

**Import addition:**
```typescript
import { fetchThreadMessages } from '../slack/fetchThreadMessages';
import type { ThreadMessage } from '../types/incident';
```

---

### Step 4: Update Notion Page Template

**File:** `src/notion/pageTemplate.ts`

Update function signature (line 12):

```typescript
export function buildIncidentPageBlocks(
  data: IncidentFormData,
  threadMessages?: ThreadMessage[]
): BlockObjectRequest[]
```

Add thread context toggle block after description (around line 60):

```typescript
// Add the actual description from Slack
blocks.push({
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: [{ type: 'text', text: { content: data.description } }],
  },
});

// Add thread context if available
if (threadMessages && threadMessages.length > 0) {
  const messageCount = threadMessages.length;
  const toggleTitle = `💬 Thread Context (${messageCount} message${messageCount > 1 ? 's' : ''})`;

  // Create toggle block with thread messages
  const toggleChildren: BlockObjectRequest[] = threadMessages.map((msg) => ({
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `${msg.userName} • ${msg.formattedTime}\n${msg.text}`,
          },
        },
      ],
      color: 'gray',
    },
  }));

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [
        {
          type: 'text',
          text: { content: toggleTitle },
          annotations: { bold: true },
        },
      ],
      children: toggleChildren,
    },
  });
}
```

**Import addition:**
```typescript
import type { ThreadMessage } from '../types/incident';
```

---

### Step 5: Update Create Incident Function

**File:** `src/notion/createIncident.ts`

Update function signature (line 20):

```typescript
export async function createIncident(
  data: IncidentFormData,
  threadMessages?: ThreadMessage[]
): Promise<CreateIncidentResult>
```

Update page template call (around line 140):

```typescript
const pageBlocks = buildIncidentPageBlocks(data, threadMessages);
```

**Import addition:**
```typescript
import type { ThreadMessage } from '../types/incident';
```

---

### Step 6: Update Type Definitions

**File:** `src/types/incident.ts`

Add new interface (around line 29):

```typescript
export interface ThreadMessage {
  user: string;           // Slack user ID (e.g., "U1234567890")
  userName: string;       // Display name (e.g., "John Doe")
  text: string;          // Message text content
  timestamp: string;     // Raw Slack timestamp (e.g., "1234567890.123456")
  formattedTime: string; // Human-readable time (e.g., "2:30 PM")
}
```

---

### Step 7: Update Documentation

**File:** `docs/SLACK_SCOPES_SETUP.md`

Add section about thread message scopes:

```markdown
## Thread Messages Feature

### Required Scopes

To fetch thread messages when reporting incidents, the following scopes are required:

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
- Fetch all messages from threads when creating incidents
- Include thread context in Notion incident pages
- Provide complete conversation history for better incident understanding

### Privacy Considerations

These scopes grant the bot access to message history in channels where it's invited. The bot will only fetch messages from threads when explicitly creating an incident from that thread. Thread messages are only stored in the associated Notion incident page.
```

**File:** `docs/USER_GUIDE.md`

Update the "Report as Incident" section (around line 86):

```markdown
4. **Submit the form**
   - The incident will be linked to the original Slack message thread
   - If the message is part of a thread, all thread messages will be captured
   - Updates will be posted in that thread
   - Thread context will be available in the Notion page under "What Happened"
```

---

## Error Handling

### Graceful Degradation

The feature should fail gracefully if:
- Scopes are not yet added → Log warning, skip thread fetching
- Thread fetch fails → Log error, create incident without thread context
- User info fetch fails → Use "Unknown User" as fallback
- Rate limit exceeded → Log warning, proceed with partial thread data

**Implementation:**
```typescript
try {
  const threadResult = await fetchThreadMessages(...);
  if (threadResult) {
    threadMessages = threadResult.messages;
  }
} catch (error) {
  logger.warn('Failed to fetch thread messages, proceeding without thread context', {
    error,
  });
  // Continue with incident creation
}
```

### Rate Limit Handling

For threads with many messages, implement pagination carefully:
- Limit initial fetch to 30 messages (balance between context and performance)
- Log if `hasMore: true` to indicate truncated thread
- Consider adding a note in Notion if thread was truncated

**Example note block:**
```typescript
if (threadResult.hasMore) {
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{
        type: 'text',
        text: {
          content: `⚠️ This thread contains more than ${limit} messages. Only the first ${limit} are shown here.`,
        },
      }],
      icon: { emoji: '⚠️' },
      color: 'yellow',
    },
  });
}
```

---

## Testing Plan

### Unit Tests

**Test:** `fetchThreadMessages` function
- ✅ Successfully fetches thread messages
- ✅ Handles empty threads (parent only)
- ✅ Handles API errors gracefully
- ✅ Formats timestamps correctly
- ✅ Resolves user names correctly
- ✅ Falls back to "Unknown User" when user info fails

**Test:** Notion page template
- ✅ Renders toggle block with thread messages
- ✅ Handles no thread messages (undefined)
- ✅ Handles empty thread messages array
- ✅ Formats message count correctly (singular/plural)

### Integration Tests

1. **Test:** Report incident from standalone message
   - Expected: No thread context added to Notion page

2. **Test:** Report incident from parent message of thread
   - Expected: All thread replies captured in toggle block

3. **Test:** Report incident from reply in thread
   - Expected: All thread messages (including parent) captured

4. **Test:** Report incident from very long thread (100+ messages)
   - Expected: First 30 messages captured, warning about truncation

5. **Test:** Report incident when scopes not yet added
   - Expected: Incident created without thread context, warning logged

### Manual Testing Checklist

- [ ] Add `channels:history` and `groups:history` scopes
- [ ] Reinstall app to workspace
- [ ] Create a test thread with 5-10 messages
- [ ] Report incident from a reply in the thread
- [ ] Verify Notion page includes toggle block
- [ ] Expand toggle and verify all messages are present
- [ ] Verify user names are resolved correctly
- [ ] Verify timestamps are formatted correctly
- [ ] Test with thread containing 1 message (parent only)
- [ ] Test with thread containing 50+ messages (truncation)
- [ ] Verify error handling when thread is deleted/inaccessible

---

## Performance Considerations

### API Call Costs

**Per incident creation from thread:**
- 1 call to `conversations.replies` (fetch thread)
- N calls to `users.info` (where N = number of unique users in thread)

**Optimization:** Cache user info
```typescript
// Simple in-memory cache
const userNameCache = new Map<string, string>();

async function getUserName(client: WebClient, userId: string): Promise<string> {
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId)!;
  }

  const userInfo = await client.users.info({ user: userId });
  const userName = userInfo.user?.profile?.display_name ||
                   userInfo.user?.real_name ||
                   'Unknown User';

  userNameCache.set(userId, userName);
  return userName;
}
```

### Rate Limit Mitigation

**Strategies:**
1. Limit thread fetch to 30 messages max (balances context vs API calls)
2. Implement user name caching (reduces `users.info` calls)
3. Add retry logic with exponential backoff for rate limit errors
4. Log rate limit warnings for monitoring

**Future improvement:** Queue-based processing for large threads

---

## Security and Privacy

### Data Access

**Scope implications:**
- `channels:history` grants read access to all public channel history
- `groups:history` grants read access to all private channel history
- Bot only fetches messages when explicitly creating an incident

**Privacy considerations:**
1. Thread messages stored in Notion incident pages
2. Notion access controls apply (workspace permissions)
3. No message content is stored in bot database
4. Thread fetching only occurs on user action (reporting incident)

**Recommendation:** Document in privacy policy that thread context is captured when reporting incidents.

### Permissions

**Required:**
- Slack workspace admin approval for new scopes
- Notion workspace admin approval (if changing access patterns)

**User notification:**
Consider adding a note in the incident modal:
```
ℹ️ If this message is part of a thread, all thread messages will be
   included in the incident report for context.
```

---

## Rollout Plan

### Phase 1: Scope Addition
1. Add `channels:history` and `groups:history` scopes
2. Reinstall app to workspace
3. Update documentation
4. No code changes yet (graceful degradation)

### Phase 2: Implementation
1. Implement `fetchThreadMessages` function
2. Update incident submission handler
3. Update Notion page template
4. Add type definitions
5. Deploy to staging environment

### Phase 3: Testing
1. Run unit tests
2. Run integration tests
3. Perform manual testing
4. Validate in staging with real threads

### Phase 4: Production Deployment
1. Deploy to production
2. Monitor logs for errors
3. Validate with small test thread
4. Announce feature to team

### Phase 5: Monitoring
1. Monitor API rate limit usage
2. Track thread fetch success rate
3. Gather user feedback
4. Identify edge cases

---

## Future Enhancements

### 1. Configurable Message Limit
Allow admins to configure max thread messages via environment variable:
```typescript
const MAX_THREAD_MESSAGES = parseInt(process.env.MAX_THREAD_MESSAGES || '30', 10);
```

### 2. Rich Message Formatting
Support Slack message formatting in Notion:
- Links (markdown conversion)
- User mentions (@user → Notion mention)
- Code blocks (preserve formatting)
- Attachments (note attachment presence)

### 3. Thread Reactions Summary
Show message reactions in Notion:
```
User A • 2:30 PM
"Payment gateway is timing out"
👍 3  🔥 2  👀 1
```

### 4. Selective Message Inclusion
Add checkbox in modal to include/exclude thread context:
```
☑️ Include thread context (12 messages)
```

### 5. Thread Metadata
Add thread statistics to Notion:
- Total participant count
- Time range (first → last message)
- Average response time

### 6. Fetch Complete Threads
For very long threads, implement pagination to fetch all messages:
```typescript
async function fetchCompleteThread(
  client: WebClient,
  channelId: string,
  threadTs: string
): Promise<ThreadMessage[]> {
  // Implement cursor-based pagination
  // Fetch all messages regardless of count
}
```

---

## Decision Log

**Decision 1:** Use toggle block (Option B) instead of inline quotes (Option A)
- **Rationale:** Better scalability for long threads, cleaner page structure
- **Trade-off:** Context hidden by default (acceptable)

**Decision 2:** Limit to 30 messages by default
- **Rationale:** Balance between context and API performance
- **Trade-off:** Very long threads will be truncated

**Decision 3:** Skip parent message when including thread
- **Rationale:** Parent message already captured in description field
- **Trade-off:** User might expect to see it in thread context too (minor)

**Decision 4:** Fetch user display names for each message
- **Rationale:** Better readability than Slack user IDs
- **Trade-off:** Additional API calls (mitigated by caching)

**Decision 5:** Graceful degradation if scopes missing
- **Rationale:** Don't break incident creation if feature not fully configured
- **Trade-off:** Silent failure mode (mitigated by logging)

---

## Summary

### What Changes

**New files:**
- `src/slack/fetchThreadMessages.ts` - Thread fetching logic

**Modified files:**
- `src/slack/handlers/incidentSubmission.ts` - Fetch thread on submission
- `src/notion/pageTemplate.ts` - Add toggle block for thread
- `src/notion/createIncident.ts` - Accept thread messages parameter
- `src/types/incident.ts` - Add ThreadMessage interface
- `docs/SLACK_SCOPES_SETUP.md` - Document new scopes
- `docs/USER_GUIDE.md` - Document thread context feature

**Slack configuration:**
- Add `channels:history` scope
- Add `groups:history` scope
- Reinstall app to workspace

### Estimated Effort

- **Development:** 4-6 hours
- **Testing:** 2-3 hours
- **Documentation:** 1-2 hours
- **Deployment:** 1 hour
- **Total:** ~8-12 hours

### Risks

**Low risk:**
- Feature is additive (doesn't change existing behavior)
- Graceful degradation prevents breaking changes
- Scopes are standard and low-impact
- Implementation is straightforward

**Mitigation:**
- Thorough testing in staging environment
- Monitor API rate limit usage
- Gather user feedback early
- Document rollback plan

---

## Questions for Discussion

1. **Message limit:** Is 30 messages the right default? Should it be configurable?

2. **Privacy:** Should we add a consent message in the modal about thread capture?

3. **Formatting:** Should we invest in rich message formatting (links, mentions) in Phase 1?

4. **Truncation:** For threads exceeding the limit, should we fetch the most recent N messages or the first N messages?

5. **Toggle default state:** Should the toggle block be expanded or collapsed by default?

6. **Alternative approach:** Should we consider the hybrid approach (Option A/B/C based on thread length)?

---

## References

- [Slack API: conversations.replies](https://docs.slack.dev/reference/methods/conversations.replies)
- [Slack API: Retrieving Messages](https://docs.slack.dev/messaging/retrieving-messages)
- [Notion API: Block Types](https://developers.notion.com/reference/block)
- [Slack Bolt Framework](https://slack.dev/bolt-js/)

---

*Document created: 2025-01-04*
*Last updated: 2025-01-04*
*Status: Design Complete - Ready for Implementation*
