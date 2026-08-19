/**
 * Digest message formatter
 * Posted to SLACK_DIGEST_CHANNEL_ID for SD/Accounts/Heads notifications
 */

import { IncidentFormData, IncidentSeverity } from '../../types/incident';
import { formatUserGroupMention } from '../mentions';

interface DigestMessageOptions {
  incidentData: IncidentFormData;
  notionPageUrl: string;
  teamNames?: string[];
  slackThreadUrl?: string;
  triageGroupId?: string;
}

/**
 * Creates a compact digest message for the digest channel
 * Designed for executive/leadership visibility
 */
export function createDigestMessage({
  incidentData,
  notionPageUrl,
  teamNames = [],
  slackThreadUrl,
  triageGroupId,
}: DigestMessageOptions) {
  const severityEmojiMap: Record<IncidentSeverity, string> = {
    'ASAP': '⚡',
    'High': '🟠',
    'Normal': '🟡',
    'Low': '🟢',
  };
  const severityEmoji = severityEmojiMap[incidentData.severity] || '⚪';

  // Truncate description to 200 characters for compact view
  const maxDescLength = 200;
  const truncatedDesc = incidentData.description.length > maxDescLength
    ? `${incidentData.description.substring(0, maxDescLength)}...`
    : incidentData.description;

  // Build team info
  const teamInfo = teamNames.length > 0
    ? teamNames.join(', ')
    : 'No team assigned';

  // Mention the triage group so new reports get picked up
  const triageMention = formatUserGroupMention(triageGroupId);

  // Build links section
  const links = [`📝 <${notionPageUrl}|View in Notion>`];
  if (slackThreadUrl) {
    links.push(`💬 <${slackThreadUrl}|Slack Thread>`);
  }

  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🚨 *New Incident: ${incidentData.title}*\n${severityEmoji} *${incidentData.severity}* | Team: ${teamInfo} | Reporter: <@${incidentData.createdBy}>`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${truncatedDesc}`,
      },
    },
  ];

  if (triageMention) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${triageMention} please triage this incident: confirm severity and assign an Owner in Notion.`,
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: links.join(' • '),
      },
    ],
  });

  return {
    text: `🚨 New Incident: ${incidentData.title}`,
    blocks,
  };
}
