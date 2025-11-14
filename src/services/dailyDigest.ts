/**
 * Daily Digest Scheduler Service
 * Sends daily summary of unassigned incidents to configured Slack channel
 */

import * as cron from 'node-cron';
import { getUnassignedIncidents } from '../notion/queries/unassignedIncidents';
import { createDailyDigestMessage } from '../slack/messages/dailyDigest';
import { slackApp } from '../slack/client';
import { getTeamNamesByIds } from '../notion/teamsCache';
import { env } from '../config/env';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('daily-digest-scheduler');

/**
 * Sends daily digest of unassigned incidents
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

    // Fetch unassigned incidents
    const incidents = await getUnassignedIncidents();

    logger.info('Unassigned incidents fetched', {
      count: incidents.length,
    });

    // Skip sending digest if no unassigned incidents
    if (incidents.length === 0) {
      logger.info('No unassigned incidents, skipping daily digest');
      return;
    }

    // Resolve team names for all incidents
    const teamNamesMap = new Map<string, string[]>();
    incidents.forEach(incident => {
      if (incident.teamIds && incident.teamIds.length > 0) {
        const teamNames = getTeamNamesByIds(incident.teamIds);
        teamNamesMap.set(incident.id, teamNames);
      }
    });

    // Format the digest message
    const digestMessage = createDailyDigestMessage({
      incidents,
      teamNamesMap,
    });

    // Post to Slack digest channel
    await slackApp.client.chat.postMessage({
      channel: env.SLACK_DIGEST_CHANNEL_ID,
      ...digestMessage,
    });

    logger.info('Daily digest sent successfully', {
      channel: env.SLACK_DIGEST_CHANNEL_ID,
      incidentCount: incidents.length,
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
