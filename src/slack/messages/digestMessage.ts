/**
 * Digest message formatter
 * Posted to SLACK_DIGEST_CHANNEL_ID for SD/Accounts/Heads notifications
 */

import { IncidentFormData, IncidentSeverity } from '../../types/incident';

interface DigestMessageOptions {
  incidentData: IncidentFormData;
  notionPageUrl: string;
  teamNames?: string[];
  slackThreadUrl?: string;
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

  // Build links section
  const links = [`📝 <${notionPageUrl}|View in Notion>`];
  if (slackThreadUrl) {
    links.push(`💬 <${slackThreadUrl}|Slack Thread>`);
  }

  return {
    text: `🚨 New Incident: ${incidentData.title}`,
    blocks: [
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
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: links.join(' • '),
          },
        ],
      },
    ],
  };
}
