/**
 * Daily Digest Scheduler Service
 * Sends daily summary of unassigned and stale incidents to configured Slack channel
 */

import * as cron from 'node-cron';
import {
  getDigestIncidents,
  DigestIncident,
  DigestIncidentStatus,
} from '../notion/queries/unassignedIncidents';
import { createDailyDigestMessage } from '../slack/messages/dailyDigest';
import { slackApp } from '../slack/client';
import { getTeamNamesByIds } from '../notion/teamsCache';
import { env } from '../config/env';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('daily-digest-scheduler');

const staleThresholdDaysByStatus: Record<DigestIncidentStatus, number> = {
  'Open': 7,
  'Ready for Review': 7,
  'In Progress': 28,
};

function isStaleIncident(incident: DigestIncident): boolean {
  return incident.daysSinceLastUpdate >= staleThresholdDaysByStatus[incident.status];
}

async function buildOwnerDisplayMap(
  staleIncidents: DigestIncident[]
): Promise<Map<string, string>> {
  const ownerDisplayMap = new Map<string, string>();
  const emailToMentionCache = new Map<string, string | undefined>();
  let mentionResolvedCount = 0;
  let mentionFallbackCount = 0;
  let unassignedCount = 0;

  for (const incident of staleIncidents) {
    if (!incident.ownerNotionId) {
      ownerDisplayMap.set(incident.id, 'Unassigned');
      unassignedCount += 1;
      continue;
    }

    if (!incident.ownerEmail) {
      ownerDisplayMap.set(incident.id, incident.ownerName || 'Unassigned');
      mentionFallbackCount += 1;
      continue;
    }

    let mention = emailToMentionCache.get(incident.ownerEmail);

    if (mention === undefined) {
      try {
        const result = await slackApp.client.users.lookupByEmail({
          email: incident.ownerEmail,
        });

        mention = result.user?.id ? `<@${result.user.id}>` : undefined;
      } catch (error) {
        logger.warn('Failed to resolve Slack owner mention by email', {
          incidentId: incident.id,
          ownerEmail: incident.ownerEmail,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        mention = undefined;
      }

      emailToMentionCache.set(incident.ownerEmail, mention);
    }

    if (mention) {
      ownerDisplayMap.set(incident.id, mention);
      mentionResolvedCount += 1;
    } else {
      ownerDisplayMap.set(incident.id, incident.ownerName || 'Unassigned');
      mentionFallbackCount += 1;
    }
  }

  logger.info('Resolved stale incident owner display values', {
    staleCount: staleIncidents.length,
    mentionResolvedCount,
    mentionFallbackCount,
    unassignedCount,
  });

  return ownerDisplayMap;
}

/**
 * Sends daily digest of unassigned and stale incidents
 * Non-blocking - errors are logged but don't crash the app
 */
export async function sendDailyDigest(): Promise<void> {
  try {
    // Check if digest channel is configured
    if (!env.SLACK_DIGEST_CHANNEL_ID) {
      logger.debug('Digest channel not configured, skipping daily digest');
      return;
    }

    logger.info('Starting daily digest generation', {
      channel: env.SLACK_DIGEST_CHANNEL_ID,
    });

    const incidents = await getDigestIncidents();
    const staleIncidents = incidents.filter(isStaleIncident);
    const staleIncidentIds = new Set(staleIncidents.map(incident => incident.id));
    const unassignedIncidents = incidents.filter(
      incident => !incident.ownerNotionId && !staleIncidentIds.has(incident.id)
    );

    const staleByStatus = staleIncidents.reduce(
      (acc, incident) => {
        acc[incident.status] += 1;
        return acc;
      },
      {
        'Open': 0,
        'In Progress': 0,
        'Ready for Review': 0,
      } as Record<DigestIncidentStatus, number>
    );

    logger.info('Digest incidents classified', {
      totalCount: incidents.length,
      unassignedCount: unassignedIncidents.length,
      staleCount: staleIncidents.length,
      staleByStatus,
    });

    if (unassignedIncidents.length === 0 && staleIncidents.length === 0) {
      logger.info('No unassigned or stale incidents, skipping daily digest');
      return;
    }

    const incidentsToDisplay = [...staleIncidents, ...unassignedIncidents];

    const teamNamesMap = new Map<string, string[]>();
    incidentsToDisplay.forEach(incident => {
      if (incident.teamIds && incident.teamIds.length > 0) {
        const teamNames = getTeamNamesByIds(incident.teamIds);
        teamNamesMap.set(incident.id, teamNames);
      }
    });

    const ownerDisplayMap = await buildOwnerDisplayMap(staleIncidents);

    const digestMessage = createDailyDigestMessage({
      unassignedIncidents,
      staleIncidents,
      teamNamesMap,
      ownerDisplayMap,
    });

    // Post to Slack digest channel
    await slackApp.client.chat.postMessage({
      channel: env.SLACK_DIGEST_CHANNEL_ID,
      ...digestMessage,
    });

    logger.info('Daily digest sent successfully', {
      channel: env.SLACK_DIGEST_CHANNEL_ID,
      unassignedCount: unassignedIncidents.length,
      staleCount: staleIncidents.length,
    });
  } catch (error) {
    // Non-blocking: log error but don't crash the app
    logger.error('Failed to send daily digest', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

/**
 * Starts the daily digest scheduler
 * Schedule: 9:00 AM Monday-Friday (GMT+1 timezone)
 * @returns Cron task reference for cleanup
 */
export function startDailyDigestScheduler(): cron.ScheduledTask {
  // Schedule: '0 9 * * 1-5' = 9:00 AM, Monday-Friday
  // Uses server's local timezone (must be GMT+1 for correct timing)
  const task = cron.schedule('0 9 * * 1-5', () => {
    logger.info('Running scheduled daily digest (9 AM weekday)');
    sendDailyDigest();
  });

  logger.info('Daily digest scheduler started', {
    schedule: '9:00 AM Monday-Friday',
    timezone: 'GMT+1 (server timezone)',
    cronExpression: '0 9 * * 1-5',
  });

  return task;
}

/**
 * Stops the daily digest scheduler
 * Used for graceful shutdown
 */
export function stopDailyDigestScheduler(task: cron.ScheduledTask): void {
  if (task) {
    task.stop();
    logger.info('Daily digest scheduler stopped');
  }
}
