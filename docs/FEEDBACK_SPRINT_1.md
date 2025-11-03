# Sprint 1 and 1.5 feedback

## Task 1: Assign Reporter in Notion using Slack user email
[ ] **Description**: Get email from Slack user (`userInfo.user.profile.email`) and look up corresponding Notion user by email to assign Reporter field in Notion Incidents DB (Person type property).
  - **Implementation notes**:
    - Query Notion workspace users via `notionClient.users.list()` and match by email
    - If match found, set `Reporter` property with Notion user ID in `createIncident()`
    - Handle case where no Notion user matches (log warning, skip Reporter assignment)
    - Reporter field is defined in `NOTION_DATABASE.md` as Person type

## Task 2: Pre-fill modal title from slash command text
[ ] **Description**: When user types `/incident Something happened`, extract the text after the command (`command.text`) and use it as default value for the Title field in the modal.
  - **Implementation notes**:
    - Extract `command.text` in `handleIncidentCommand()` in `src/slack/commands/incident.ts`
    - Pass text as `private_metadata` or `initial_values` when opening modal
    - Update `createIncidentModal()` to accept optional initial title value

## Task 3: Add "Report as Incident" message action
[ ] **Description**: Add Slack message action/shortcut that allows users to report an existing Slack message as an incident. When triggered, open modal (pre-filled with message context), create incident, and post confirmation message as a reply in the original message's thread (visible to everyone in channel).
  - **Implementation notes**:
    - Register both message action handler (`app.message_action()`) and global shortcut (`app.shortcut()`)
    - Message action: appears in message menu ("More actions" → "Report as Incident")
    - Global shortcut: keyboard shortcut (e.g., Cmd+K → "Report as Incident")
    - Extract message text/content as context for modal (pre-fill title/description)
    - Store original message timestamp and channel ID
    - Post confirmation message using `chat.postMessage()` with `thread_ts` parameter (reply in thread, visible to everyone in channel)
    - Connect thread by storing `thread_ts` as `Slack Thread ID` in Notion
    - If message is already in a thread, reply in that same thread

## Task 4: Add Due Date and Happened Date fields to modal
[ ] **Description**: Add two date picker fields to the incident modal:
  - **Due Date**: Date only (time not needed) - maps to `Due Date` property in Notion (Date type)
  - **Happened Date**: Date only - maps to `Happened Date` property in Notion (Date type)
  - **Implementation notes**:
    - Use Slack Block Kit `datepicker` element type for both fields
    - Both fields should be optional (not required)
    - Store dates as ISO date strings (YYYY-MM-DD format)
    - Update `IncidentFormData` type to include `dueDate?: string` and `happenedDate?: string`
    - Update `createIncident()` to set these properties in Notion (date only, no time component)

## Task 5: Add informational text to modal about Notion editing
[ ] **Description**: Add a context/info block to the modal explaining that after submission, the reporter can complete/edit the description in Notion.
  - **Implementation notes**:
    - Add a Block Kit `context` or `section` block with informational text
    - Place it near the description field or at the bottom of the modal
    - Text suggestion: "You can edit or complete this description in Notion after submission"

## Task 6: Add "Why it matters" optional field to modal
[ ] **Description**: Add an optional text input field "Why it matters" to the modal. Store this content in the Notion page body under the "🎯 Why It Matters" section (as defined in `NOTION_PAGE_TEMPLATE.md`), not as a database property.
  - **Implementation notes**:
    - Add optional multiline text input to modal
    - Update `IncidentFormData` type to include `whyItMatters?: string`
    - Update `buildIncidentPageBlocks()` in `src/notion/pageTemplate.ts` to include "Why It Matters" section with provided content
    - If field is empty, still include the section header but leave content empty

## Task 7: Add Team selection from Notion Teams database
[ ] **Description**: Add a team selector dropdown to the modal that queries Notion Teams database (`NOTION_TEAMS_DB_ID` from env) to populate options. Selected team(s) should be stored in Notion Incidents DB `Team` property (Relation field with multiple selection).
  - **Implementation notes**:
    - Add `NOTION_TEAMS_DB_ID` to `EnvConfig` type and `env.ts` validation (optional field)
    - Create helper function to query Teams DB and return list of teams (name + page ID)
    - Query Teams DB when opening modal (or cache teams list for performance)
    - Add `multi_static_select` block to modal (supports multiple team selection)
    - Update `IncidentFormData` type to include `teamIds?: string[]` (array of Notion page IDs)
    - Update `createIncident()` to set Team property in Notion as Relation type with multiple values
    - Team property exists in Incidents DB as Relation field with multiple selection enabled
    - Handle case where Teams DB is not configured (make team selector optional/disabled if `NOTION_TEAMS_DB_ID` missing)
