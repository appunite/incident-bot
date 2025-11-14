/**
 * Daily digest message formatter
 * Formats unassigned incidents into a scheduled daily summary
 */

import { UnassignedIncident } from '../../notion/queries/unassignedIncidents';
import { IncidentSeverity } from '../../types/incident';

interface DailyDigestMessageOptions {
  incidents: UnassignedIncident[];
  teamNamesMap: Map<string, string[]>; // Maps incident ID to team names
}

/**
 * Creates daily digest message for unassigned incidents
 * Groups by severity and shows key information
 */
export function createDailyDigestMessage({
  incidents,
  teamNamesMap,
}: DailyDigestMessageOptions) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Note: This function is only called when incidents.length > 0
  // Empty state is handled in the scheduler service

  // Group incidents by severity
  const severityOrder: IncidentSeverity[] = ['ASAP', 'High', 'Normal', 'Low'];
  const severityEmojiMap: Record<IncidentSeverity, string> = {
    'ASAP': '⚡',
    'High': '🟠',
    'Normal': '🟡',
    'Low': '🟢',
  };

  const groupedIncidents = new Map<IncidentSeverity, UnassignedIncident[]>();
  severityOrder.forEach(severity => {
    groupedIncidents.set(severity, []);
  });

  incidents.forEach(incident => {
    const group = groupedIncidents.get(incident.severity);
    if (group) {
      group.push(incident);
    }
  });

  // Build message blocks
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📋 Daily Incident Digest - ${today}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `⚠️ *${incidents.length} incident${incidents.length !== 1 ? 's' : ''} need${incidents.length === 1 ? 's' : ''} attention*`,
      },
    },
    {
      type: 'divider',
    },
  ];

  // Add incidents grouped by severity
  severityOrder.forEach(severity => {
    const incidentsInGroup = groupedIncidents.get(severity) || [];

    incidentsInGroup.forEach(incident => {
      const emoji = severityEmojiMap[severity];
      const teamNames = teamNamesMap.get(incident.id) || [];
      const teamInfo = teamNames.length > 0
        ? teamNames.join(', ')
        : 'No team';

      // Format days ago
      const daysText = incident.daysSinceCreation === 0
        ? 'today'
        : incident.daysSinceCreation === 1
        ? '1 day ago'
        : `${incident.daysSinceCreation} days ago`;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${severity}* | ${daysText}\n*${incident.title}*\nTeam: ${teamInfo} | Area: ${incident.area}\n📝 <${incident.url}|View in Notion>`,
        },
      });
    });
  });

  // Add footer
  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '💡 Assign owners in Notion to resolve these incidents',
        },
      ],
    }
  );

  return {
    text: `📋 Daily Incident Digest - ${today} (${incidents.length} unassigned)`,
    blocks,
  };
}
