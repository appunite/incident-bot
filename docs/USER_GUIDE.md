# User Guide - Incident Bot

## Table of Contents
- [How to Report an Incident](#how-to-report-an-incident)
- [How to Manage Incidents in Notion](#how-to-manage-incidents-in-notion)
- [Best Practices](#best-practices)
- [FAQ](#faq)

---

## How to Report an Incident

### Method 1: Using the `/incident` Slash Command

This is the primary way to report a new incident in Slack.

**Steps:**

1. **Open the command**
   - In any Slack channel or DM, type `/incident` and press Enter
   - You can optionally add a title immediately: `/incident Payment webhook timeouts`

2. **Fill out the incident form**

   The modal will open with the following fields:

   **Required Fields:**

   - **Incident Title** (max 200 characters)
     - Brief, descriptive summary of the incident
     - Example: "Payment webhook timeouts on VIO project"

   - **Description** (max 3000 characters)
     - Detailed explanation of what happened
     - Include: impact, affected systems/users, and any relevant context
     - You can edit or expand this later in Notion

   - **Severity** - Choose the appropriate level:
     - **ASAP** - Urgent but limited scope (e.g., single client affected)
     - **High** - Important but not blocking
     - **Normal** - Regular priority issue
     - **Low** - Minor issue, low urgency

   - **Area** - Select the affected domain:
     - **Client** - Issues affecting external clients
     - **Internal** - Internal tools, processes, or systems
     - **Process** - Workflow or methodology issues
     - **People** - Team dynamics, communication, or HR-related
     - **Client Communication** - Issues with client communication

   **Optional Fields:**

   - **Happened Date** - When the incident actually occurred
   - **Discover Date** - When the incident was discovered or first noticed (defaults to today)
   - **Due Date** - Target resolution or next action checkpoint
   - **Why It Matters** (max 1000 characters) - Business impact and importance
   - **Team** - Select one or more teams involved or affected

3. **Submit the form**
   - Click **Submit** to create the incident
   - The bot will confirm the submission in Slack
   - A new page will be created in the Notion Incidents database

### Method 2: Using "Report as Incident" Message Shortcut

This method lets you convert an existing Slack message into an incident.

**Steps:**

1. **Find the message** you want to report as an incident

2. **Open message actions**
   - Hover over the message
   - Click the three dots menu (⋮) on the right
   - Select **"Report as Incident"** from the shortcuts menu

3. **Review and edit**
   - The incident form opens with the message text pre-filled as both title and description
   - Edit the title (the message text is truncated to 200 characters)
   - Adjust the description as needed
   - Fill in the remaining fields (Severity, Area, etc.)

4. **Submit the form**
   - The incident will be linked to the original Slack message thread
   - If the message is part of a thread, all thread messages will be captured and added to the Notion page
   - Updates will be posted in that thread
   - Thread context will be available in the Notion page under "What Happened" in a collapsible toggle block

### What Happens After Submission?

1. **Notion Page Created**
   - A new page is automatically created in the Incidents database
   - Your Slack email is used to assign the **Reporter** field
   - Status is set to "Open" by default
   - Created From is set to "Manual"

2. **Slack Confirmation**
   - A confirmation message is posted to Slack with:
     - Incident details
     - Direct link to the Notion page
     - Easy access to view and manage the incident

3. **Slack Thread Link**
   - The Notion page includes a link back to the Slack thread
   - This creates a two-way connection between Slack and Notion

4. **Thread Context (If Applicable)**
   - If the incident was created from a threaded message, all thread replies are captured
   - Thread messages appear in a collapsible toggle block under "What Happened"
   - Shows user name, timestamp, and message content for each reply
   - Provides complete conversation context for better understanding

---

## How to Manage Incidents in Notion

### Opening the Incidents Database

The Incidents database is your central hub for tracking all reported incidents. Access it through:
- The Slack confirmation message link after reporting
- Your Notion workspace (search for "Incidents")

### Understanding the Database Views

The Incidents database includes several pre-configured views:

**1. By Status** (Board view)
- Grouped by: Status (Open, In Progress, Resolved, Invalid)
- Use for: Daily standup, triage, and tracking progress
- Shows: Title, Owner, Severity

**2. By Severity** (Board view)
- Grouped by: Severity level
- Use for: Prioritization and bubbling up critical issues
- Shows: Title, Status, Owner

**3. All Incidents** (Table view)
- Shows all fields in a comprehensive table
- Use for: Full audit, reporting, and detailed analysis
- Sorted by: Detected Date (newest first)

**4. Timeline** (Timeline view)
- Visualizes incidents over time
- Use for: Understanding incident load and patterns
- Timeline by: Detected Date

**5. Unassigned** (Table view)
- Filters incidents without an Owner
- Use for: Triage queue and assignment
- This is where new incidents first appear

**6. Postmortem Pending** (Table view)
- Shows resolved incidents without completed postmortems
- Use for: Follow-through on learnings and documentation

### Key Fields and How to Use Them

**Core Fields:**

- **Title** - Clear, action-oriented incident name
- **Status** - Current state of the incident:
  - **Open** - Newly reported, not yet assigned
  - **In Progress** - Actively being worked on
  - **Resolved** - Issue mitigated or fixed
  - **Invalid** - Incident was invalid or a false alarm
- **Severity** - Impact level (set during reporting)
- **Area** - Affected domain (set during reporting)
- **Description** - Summary of what happened
- **Impact** - Affected users, systems, scope, and business impact

**Assignment Fields:**

- **Owner** - Person responsible for driving progress and updates
  - This person should coordinate resolution efforts
  - Update status regularly
  - Communicate with stakeholders
- **Accountable** - Person accountable for outcomes and postmortem quality
  - Usually a team lead or manager
  - Ensures proper follow-through
  - May be the same as Owner for smaller incidents
- **Reporter** - Original reporter (auto-assigned from Slack)

**Tracking Fields:**

- **Happened Date** - When the incident actually occurred
- **Discover Date** - When the incident was discovered or first noticed
- **Detected Date** - When it was first detected or acknowledged (auto-set)
- **Due Date** - Target resolution or next action checkpoint
- **Created From** - Origin of the record (Manual, Automatic, Email, API, Phone)
- **Slack Message URL** - Link to the Slack thread for context

**Documentation Fields:**

- **Trigger** - What initiated detection (e.g., "PagerDuty alert", "Client email")
- **Postmortem Completed** - Checkbox to mark when postmortem is done

**System Fields:**

- **Last Synced** - Last automation sync time
- **Updated By System** - Indicates if last update was automated
- **Slack Thread ID** - Internal reference for automation
- **Slack Channel ID** - Internal reference for automation

### Common Workflows

#### 1. Triaging a New Incident

1. Go to the **Unassigned** view
2. Open the incident page
3. Review the description and assess severity
4. Assign an **Owner** (drag to person or click to select)
5. Set **Accountable** if different from Owner
6. Update **Status** to "In Progress"
7. Add any missing information (Impact, Trigger, Client)

#### 2. Working on an Incident

1. Keep the **Status** updated as you make progress
2. Add updates and findings to the page body
3. Use the **Slack Message URL** to jump to the related discussion
4. Update **Due Date** if timeline changes
5. Document resolution steps in the page

#### 3. Resolving an Incident

1. Update **Status** to "Resolved"
2. Document the resolution in the page body
3. Fill in the **Impact** field with final scope
4. Check if a postmortem is needed

#### 4. Completing a Postmortem

1. Go to the **Postmortem Pending** view
2. Open the resolved incident
3. Add a postmortem section to the page with:
   - What happened (timeline)
   - Root cause analysis
   - What went well
   - What could be improved
   - Action items (with owners)
4. Check the **Postmortem Completed** box
5. Update **Status** to "Invalid" or "Resolved"

### Using the Slack Thread Link

Every incident page includes a **Slack Message URL** that links back to the Slack conversation.

**Benefits:**
- Quick access to real-time discussion
- See who's involved and what's being said
- Post updates to keep stakeholders informed
- Maintain context between Notion documentation and Slack collaboration

**To use:**
- Click the Slack Message URL in the incident page
- Slack will open directly to the relevant thread
- Post updates in the thread to keep everyone informed

---

## Best Practices

### When to Report an Incident

Report an incident whenever you encounter:
- Service disruptions or outages
- Client-facing issues or complaints
- Missed deadlines or deliverables
- Communication breakdowns
- Process failures
- Security concerns
- Data integrity issues
- Team conflicts or collaboration issues

**Remember:** Incidents are learning opportunities, not blame assignments. When in doubt, report it.

### Writing Good Incident Titles

**Do:**
- Keep it short and specific (under 100 characters is ideal)
- Use action-oriented language
- Include the affected system or client
- Make it scannable at a glance

**Examples of good titles:**
- "Payment webhook timeouts on VIO project"
- "Production deployment failed for Allegro dashboard"
- "Client reported missing data in reports"
- "Team member unavailable during critical meeting"

**Don't:**
- Be too vague: "Something is broken"
- Use only technical jargon: "HTTP 500 on /api/v2/endpoint"
- Include timestamps in the title (use Happened Date instead)

### Writing Good Incident Descriptions

**Include:**
1. **What happened** - Clear statement of the issue
2. **When** - Timeframe or when it was first noticed
3. **Impact** - Who or what is affected
4. **Context** - Relevant background or circumstances

**Example:**
```
Users on the VIO project are experiencing payment processing failures.
Started around 10:30 AM today. Approximately 15 payment attempts have
failed. The checkout flow completes but webhooks are timing out after
30 seconds. This affects new subscription signups. Client has been
notified and we've switched to manual payment processing as a workaround.
```

**Why It Matters section (optional):**
Use this to explain business impact, urgency drivers, or strategic importance:
```
This impacts our largest client's Black Friday promotion. Each failed
payment represents lost revenue for both the client and us. The client's
CEO is personally monitoring this launch.
```

### Choosing the Right Severity

Use this guide to select appropriate severity:

**ASAP**
- Urgent issue with limited scope
- Single client affected
- Workaround available but not ideal
- Time-sensitive but not blocking
- Client escalation
- **Response time: Same day**

**High**
- Important but not blocking work
- Affects team efficiency or delivery
- Needs attention soon
- Significant impact but manageable
- **Response time: Within a few days**

**Normal**
- Regular priority issue
- Can be scheduled with other work
- Standard workflow issues
- **Response time: Within a week**

**Low**
- Minor inconvenience
- Nice-to-have improvement
- Low urgency
- **Response time: When capacity allows**

### Selecting the Right Area

**Client** - Use when:
- External clients are affected
- Client-facing features are broken
- Client data is involved
- Issue originated from client feedback

**Internal** - Use when:
- Internal tools or systems are affected
- Developer experience is impacted
- CI/CD pipeline issues
- Infrastructure problems

**Process** - Use when:
- Workflow or methodology broke down
- Standard processes weren't followed
- Documentation gaps caused issues
- Handoffs failed

**People** - Use when:
- Team dynamics affected work
- Communication issues between team members
- Resource allocation problems
- Skill gaps identified

**Client Communication** - Use when:
- Miscommunication with client
- Missed client meetings or updates
- Documentation sent to client was incorrect
- Expectation misalignment

### Team Assignment

**When to assign teams:**
- Multiple teams are affected or involved
- Cross-team coordination is needed
- Team-specific expertise is required
- For reporting and analytics purposes

**Tips:**
- Assign teams during incident creation if known
- Add teams later during triage if needed
- Use teams to improve filtering and reporting
- Teams help identify patterns in incident sources

### Fostering a Blameless Culture

**Remember:**
- Incidents are system problems, not personal failures
- The goal is learning and improvement, not punishment
- Focus on "what happened" not "who caused it"
- Everyone makes mistakes; systems should prevent them
- Psychological safety encourages reporting

**During postmortems:**
- Use neutral language
- Focus on timeline and facts
- Identify system weaknesses
- Create actionable improvements
- Celebrate good incident responses
- Thank people for reporting issues

### Follow-Up and Documentation

**Best practices:**
1. **Update regularly** - Keep Status current as you work
2. **Document as you go** - Add findings and decisions to the page
3. **Link related items** - Connect to similar incidents or action items
4. **Complete postmortems** - Don't skip this step for significant incidents
5. **Share learnings** - Post postmortem summaries to relevant channels
6. **Track action items** - Ensure improvements are implemented
7. **Review patterns** - Regularly look for recurring issues

---

## FAQ

### General Questions

**Q: What qualifies as an "incident"?**
A: Any service-related issue that affects delivery, quality, communication, or collaboration. If you're unsure, it's better to report it.

**Q: Will I get in trouble for reporting incidents?**
A: No. Incident Bot promotes a blameless culture. Reporting issues helps improve processes and prevents future problems.

**Q: Can I report incidents anonymously?**
A: Currently, no. The Reporter field is automatically assigned from your Slack account to enable follow-up and context.

### Technical Questions

**Q: Why isn't the Reporter field being filled in Notion?**
A: This requires the Slack bot to have the `users:read.email` scope. Contact your Slack workspace admin to ensure proper permissions. See [SLACK_SCOPES_SETUP.md](SLACK_SCOPES_SETUP.md) for details.

**Q: Can I edit the incident details after submitting?**
A: Yes! Click the link in the Slack confirmation message to open the Notion page, where you can edit any field or add more information.

**Q: What happens if I submit the form by accident?**
A: You can immediately update the Status to "Invalid" in Notion, or delete the page entirely if it was truly a mistake.

**Q: Can I report incidents directly in Notion?**
A: Yes, you can manually create pages in the Incidents database, but they won't be linked to Slack threads. The Slack bot is the recommended method.

### Workflow Questions

**Q: Who should be the Owner vs Accountable?**
A: The Owner drives the work and provides updates. The Accountable person ensures outcomes and postmortem quality (often a team lead). They can be the same person for smaller incidents.

**Q: How quickly should I assign an Owner?**
A: Critical and High severity incidents should be assigned within hours. Others can be triaged during daily standups or planning sessions.

**Q: When should I mark an incident as Resolved vs Invalid?**
A: Mark as **Resolved** when the issue is mitigated or fixed. Mark as **Invalid** if the report was a mistake, duplicate, or not an incident.

**Q: Do all incidents need a postmortem?**
A: Not all. Use your judgment based on severity, impact, and learning value. Generally, Critical and High severity incidents should have postmortems.

### Support Questions

**Q: The bot isn't responding. What should I do?**
A: Contact your technical admin or check the #incident-bot-support channel (if available). You can still manually create incidents in Notion.

**Q: I found a bug in the bot. Where do I report it?**
A: Report technical issues to your development team or create a GitHub issue if you have access to the repository.

**Q: Can we customize the incident fields?**
A: Yes, but this requires modifying the Notion database schema and bot code. Contact your technical team for customization requests.

---

## Need Help?

- **Documentation:** See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- **Notion Database:** See [NOTION_DATABASE.md](NOTION_DATABASE.md) for field reference
- **Incident Flow:** See [INCIDENT_FLOW.md](INCIDENT_FLOW.md) for workflow diagrams
- **Technical Setup:** See [API_REFERENCE.md](API_REFERENCE.md) for API details

For questions or feedback about the incident process, reach out to your Service Delivery Manager or team lead.
