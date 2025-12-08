/**
 * Confirmation message formatter
 * Posted to Slack after incident creation
 */

import { IncidentFormData, IncidentSeverity } from '../../types/incident';

interface ConfirmationMessageOptions {
  incidentData: IncidentFormData;
  notionPageUrl: string;
  notionPageId: string;
}

/**
 * Creates confirmation message for new incident
 */
export function createConfirmationMessage({
  incidentData,
  notionPageUrl,
  notionPageId,
}: ConfirmationMessageOptions) {
  const severityEmojiMap: Record<IncidentSeverity, string> = {
    'ASAP': '⚡',
    'High': '🟠',
    'Normal': '🟡',
    'Low': '🟢',
  };
  const severityEmoji = severityEmojiMap[incidentData.severity] || '⚪';

  return {
    text: `New incident reported: ${incidentData.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 New Incident Reported',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Title:*\n${incidentData.title}`,
          },
          {
            type: 'mrkdwn',
            text: `*Reported by:*\n<@${incidentData.createdBy}>`,
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${severityEmoji} ${incidentData.severity}`,
          },
          {
            type: 'mrkdwn',
            text: `*Area:*\n${incidentData.area}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${incidentData.description}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📝 <${notionPageUrl}|View in Notion> • ID: ${notionPageId.slice(0, 8)}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `ℹ️ *Process Note:* As the reporter, you will be asked to verify the fix when the status changes to 'Ready for Review'. <https://www.notion.so/appunite/Who-Can-Resolve-or-Close-an-Incident-2c348f00171080869a51c020b1215052|Read about the resolution process>.`,
          },
        ],
      },
    ],
  };
}
