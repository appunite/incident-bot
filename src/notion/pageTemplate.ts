/**
 * Notion page template builder
 * Creates structured incident page content using a template
 */

import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

interface TemplateData {
  description: string;
  slackThreadUrl?: string;
  whyItMatters?: string;
}

/**
 * Builds Notion page blocks from the incident template
 */
export function buildIncidentPageBlocks(data: TemplateData): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  // Section 1: What Happened
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [
        { type: 'text', text: { content: '🧠 What Happened' } },
      ],
    },
  });

  blocks.push({
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              'A short, factual summary of what occurred and how it was noticed.\nStick to facts — avoid opinions or assigning blame.',
          },
          annotations: { italic: true, color: 'gray' },
        },
      ],
    },
  });

  // Add the actual description from Slack
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: { content: data.description },
        },
      ],
    },
  });

  // Divider
  blocks.push({
    object: 'block',
    type: 'divider',
    divider: {},
  });

  // Section 2: Why It Matters
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [
        { type: 'text', text: { content: '🎯 Why It Matters' } },
      ],
    },
  });

  blocks.push({
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              'Why is this important?\nWhat are the potential consequences for the team, client, or project?',
          },
          annotations: { italic: true, color: 'gray' },
        },
      ],
    },
  });

  // Add the "Why It Matters" content if provided
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: data.whyItMatters
        ? [{ type: 'text', text: { content: data.whyItMatters } }]
        : [],
    },
  });

  // Divider
  blocks.push({
    object: 'block',
    type: 'divider',
    divider: {},
  });

  // Section 3: Resolution Plan
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [
        { type: 'text', text: { content: '🧰 Resolution Plan' } },
      ],
    },
  });

  blocks.push({
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Steps that will be taken to move this incident toward resolution:',
          },
          annotations: { italic: true, color: 'gray' },
        },
      ],
    },
  });

  // Checklist items
  const checklistItems = [
    'Assign an Owner - designate who is responsible for driving resolution',
    'Confirm Accountable - clarify who oversees progress and ensures closure',
    'Identify Root Cause - quickly assess what triggered or caused the issue',
    'Immediate Actions - what is being done right now to mitigate impact',
    'Longer-term Fix - what will be changed to prevent this from happening again',
    'Communicate Updates - inform relevant stakeholders (client, team, leadership)',
    'Update Status in Notion - move to In Progress / Resolved as appropriate',
    'Follow-up Check - review results or verify improvement after a few days',
  ];

  checklistItems.forEach((item) => {
    blocks.push({
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [
          {
            type: 'text',
            text: { content: item },
          },
        ],
        checked: false,
      },
    });
  });

  // Divider
  blocks.push({
    object: 'block',
    type: 'divider',
    divider: {},
  });

  // Section 4: Postmortem
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [
        { type: 'text', text: { content: '🧾 Postmortem' } },
      ],
    },
  });

  blocks.push({
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              'What was the real underlying cause?\nWhat worked well in the response, and what did not?\nWhat lessons did we learn?\nWhat systemic changes can we make to avoid similar issues?',
          },
          annotations: { italic: true, color: 'gray' },
        },
      ],
    },
  });

  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [],
    },
  });

  // Divider
  blocks.push({
    object: 'block',
    type: 'divider',
    divider: {},
  });

  // Section 5: Related
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [
        { type: 'text', text: { content: '🔗 Related' } },
      ],
    },
  });

  // Add Slack thread link (placeholder if not available yet)
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: data.slackThreadUrl
        ? [
            {
              type: 'text',
              text: { content: 'Slack thread: ' },
            },
            {
              type: 'text',
              text: {
                content: 'View in Slack',
                link: { url: data.slackThreadUrl }
              },
              annotations: { color: 'blue' },
            },
          ]
        : [
            {
              type: 'text',
              text: { content: 'Slack thread (link will be added automatically)' },
              annotations: { italic: true, color: 'gray' },
            },
          ],
    },
  });

  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [
        {
          type: 'text',
          text: { content: 'Related incidents' },
        },
      ],
    },
  });

  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [
        {
          type: 'text',
          text: { content: 'Docs / playbooks / client notes' },
        },
      ],
    },
  });

  return blocks;
}
