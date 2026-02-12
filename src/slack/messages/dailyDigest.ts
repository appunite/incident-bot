/**
 * Daily digest message formatter
 * Formats unassigned and stale incidents into a scheduled daily summary
 */

import { DigestIncident } from '../../notion/queries/unassignedIncidents';
import { IncidentSeverity } from '../../types/incident';

interface DailyDigestMessageOptions {
  unassignedIncidents: DigestIncident[];
  staleIncidents: DigestIncident[];
  teamNamesMap: Map<string, string[]>; // Maps incident ID to team names
  ownerDisplayMap: Map<string, string>; // Maps stale incident ID to owner display label
}

/**
 * Creates daily digest message for unassigned and stale incidents
 */
export function createDailyDigestMessage({
  unassignedIncidents,
  staleIncidents,
  teamNamesMap,
  ownerDisplayMap,
}: DailyDigestMessageOptions) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalIncidents = unassignedIncidents.length + staleIncidents.length;
  const severityOrder: IncidentSeverity[] = ['ASAP', 'High', 'Normal', 'Low'];
  const severityEmojiMap: Record<IncidentSeverity, string> = {
    'ASAP': '⚡',
    'High': '🟠',
    'Normal': '🟡',
    'Low': '🟢',
  };

  const formatDaysText = (days: number) => {
    if (days === 0) {
      return 'today';
    }
    if (days === 1) {
      return '1 day ago';
    }
    return `${days} days ago`;
  };

  const groupBySeverity = (incidents: DigestIncident[]): Map<IncidentSeverity, DigestIncident[]> => {
    const grouped = new Map<IncidentSeverity, DigestIncident[]>();
    severityOrder.forEach(severity => grouped.set(severity, []));
    incidents.forEach(incident => {
      grouped.get(incident.severity)?.push(incident);
    });
    return grouped;
  };

  const unassignedBySeverity = groupBySeverity(unassignedIncidents);
  const staleBySeverity = groupBySeverity(staleIncidents);

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
        text: `⚠️ *${totalIncidents} incident${totalIncidents !== 1 ? 's' : ''} need${totalIncidents === 1 ? 's' : ''} attention*`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Unassigned: *${unassignedIncidents.length}* | Stale: *${staleIncidents.length}*`,
        },
      ],
    },
    {
      type: 'divider',
    },
  ];

  if (unassignedIncidents.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '👥 *Unassigned incidents*',
      },
    });

    severityOrder.forEach(severity => {
      const incidentsInGroup = unassignedBySeverity.get(severity) || [];
      incidentsInGroup.forEach(incident => {
        const emoji = severityEmojiMap[severity];
        const teamNames = teamNamesMap.get(incident.id) || [];
        const teamInfo = teamNames.length > 0 ? teamNames.join(', ') : 'No team';
        const daysText = formatDaysText(incident.daysSinceCreation);

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${severity}* | ${daysText}\n*${incident.title}*\nStatus: ${incident.status} | Team: ${teamInfo} | Area: ${incident.area}\n📝 <${incident.url}|View in Notion>`,
          },
        });
      });
    });
  }

  if (staleIncidents.length > 0) {
    if (unassignedIncidents.length > 0) {
      blocks.push({ type: 'divider' });
    }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⏰ *Stale incidents (no updates for too long)*',
      },
    });

    severityOrder.forEach(severity => {
      const incidentsInGroup = staleBySeverity.get(severity) || [];
      incidentsInGroup.forEach(incident => {
        const emoji = severityEmojiMap[severity];
        const teamNames = teamNamesMap.get(incident.id) || [];
        const teamInfo = teamNames.length > 0 ? teamNames.join(', ') : 'No team';
        const owner = ownerDisplayMap.get(incident.id) || 'Unassigned';
        const staleText = formatDaysText(incident.daysSinceLastUpdate);

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${severity}* | *${incident.status}* | Last update: ${staleText}\n*${incident.title}*\nOwner: ${owner} | Team: ${teamInfo} | Area: ${incident.area}\n📝 <${incident.url}|View in Notion>`,
          },
        });
      });
    });
  }

  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '💡 Assign owners and post progress updates in Notion to remove incidents from this digest.',
        },
      ],
    }
  );

  return {
    text: `📋 Daily Incident Digest - ${today} (${totalIncidents} needing attention)`,
    blocks,
  };
}
