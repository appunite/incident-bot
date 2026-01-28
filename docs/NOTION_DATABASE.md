### Purpose

A concise reference for the Incidents database schema and how to use each field and view.

---

### Properties

Below are all properties defined in the Incidents data source, with types, allowed options, and usage guidance.

- **Title**
    - Type: Title
    - Usage: Clear, action-oriented incident name. Example: "Payment webhook timeouts on VIO".
- **Status**
    - Type: Status
    - Groups and options:
        - To do: Open
        - In progress: In Progress
        - Complete: Resolved, Invalid
        - In Progress: Ready for Review
    - Usage: Move cards as work progresses. "Ready for Review" for verification. "Resolved" means mitigated/fixed. "Invalid" means false alarm.
- **Severity**
    - Type: Select
    - Options: ASAP, High, Normal, Low
    - Usage: Use "ASAP" for urgent but limited scope issues; "High" for important but not blocking; "Normal" for regular priority; "Low" for minor issues.
- **Area**
    - Type: Select
    - Options: Client, Internal, Process, People, Client Communication
    - Usage: Tag the domain most affected.
- **Owner**
    - Type: Person
    - Usage: Responsible for driving progress and updates.
- **Accountable**
    - Type: Person
    - Usage: Accountable for outcomes and postmortem quality.
- **Reporter**
    - Type: Person
    - Usage: Original reporter (for audit and follow-up).
- **Description**
    - Type: Text
    - Usage: One or two sentences describing what happened and current understanding.
- **Impact**
    - Type: Text
    - Usage: Affected users/systems, scope, and business impact.
- **Trigger**
    - Type: Text
    - Usage: Immediate trigger or signal (e.g., "PagerDuty alert", "Client email").
- **Created From**
    - Type: Select
    - Options: Manual, Automatic, Email, API, Phone
    - Usage: Origin of the incident record.
- **Happened Date**
    - Type: Date
    - Usage: When the incident actually occurred.
- **Discover Date**
    - Type: Date
    - Usage: When the incident was discovered or first noticed.
- **Due Date**
    - Type: Date (time format H:mm)
    - Usage: Next action or target resolution checkpoint.
- **Last Synced**
    - Type: Date
    - Usage: Last time automations synced data (e.g., Slack).
- **Postmortem Completed**
    - Type: Checkbox
    - Usage: Check when the postmortem is finished and recorded.
- **Updated By System**
    - Type: Checkbox
    - Usage: Checked if the last update came from automation.
- **Slack Message URL**
    - Type: URL
    - Usage: Link to the primary Slack message for context.
- **Slack Thread ID**
    - Type: Text
    - Usage: Internal Slack reference for automation.
- **Slack Channel ID**
    - Type: Text
    - Usage: Internal Slack reference for automation.

---

### Views

- **By Status**
    - Type: Board
    - Grouped by: Status
    - Card fields: Title, Owner, Severity
    - Usage: Daily standup and triage.
- **By Severity**
    - Type: Board
    - Grouped by: Severity
    - Card fields: Title, Status, Owner
    - Usage: Bubble up critical issues.
- **All Incidents**
    - Type: Table
    - Sort: Discover Date descending
    - Columns: Title, Status, Severity, Area, Happened Date, Discover Date, Owner, Reporter, Description, Impact, Trigger, Accountable, Created From, Postmortem Completed, Slack Channel ID, Slack Thread ID, Slack Message URL, Last Synced, Updated By System, Due Date
    - Usage: Full audit and reporting.
- **Timeline**
    - Type: Timeline
    - Timeline by: Discover Date
    - Usage: See incident load over time.
- **Unassigned**
    - Type: Table
    - Sort: Discover Date descending
    - Columns: Title, Status, Severity, Area, Happened Date, Discover Date, Reporter, Description, Impact
    - Usage: Triage queue for assigning Owners.
- **Postmortem Pending**
    - Type: Table
    - Sort: Happened Date descending
    - Columns: Title, Status, Severity, Area, Happened Date, Discover Date, Owner, Reporter, Description, Impact, Postmortem Completed
    - Usage: Follow-through on learnings.

---

### Conventions and tips

- Keep titles short and specific.
- Always set Severity, Status, and Area.
- Add Owner during triage. Set Accountable if different from Owner.
- Use Description and Impact to capture business framing, not technical logs.
- Close only after postmortem is completed when applicable.

---

### Links

- Incidents database: [](https://www.notion.so/29d48f001710809b85ccea4bee227659?pvs=21)