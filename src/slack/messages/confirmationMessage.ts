/**
 * Confirmation message formatter
 * Posted to Slack after incident creation
 */

import { IncidentFormData } from '../../types/incident';

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
  const severityEmoji = {
    '🔥 Critical': '🔥',
    '🔥 High': '🔥',
    'ASAP': '⚡',
    'High': '🟠',
    'Normal': '🟡',
    'Low': '🟢',
  }[incidentData.severity] || '⚪';

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
    ],
  };
}
