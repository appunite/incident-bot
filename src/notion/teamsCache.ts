/**
 * Teams cache module
 * Caches teams from Notion to avoid slow API calls during modal opening
 */

import { getTeams, Team } from './getTeams';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('teams-cache');

interface TeamsCache {
  teams: Team[];
  lastUpdated: Date | null;
}

const cache: TeamsCache = {
  teams: [],
  lastUpdated: null,
};

// Refresh interval: 5 minutes
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let refreshInterval: NodeJS.Timeout | null = null;

/**
 * Refreshes the teams cache from Notion
 */
export async function refreshTeamsCache(): Promise<void> {
  try {
    logger.info('Refreshing teams cache...');
    const startTime = Date.now();

    const teams = await getTeams();

    cache.teams = teams;
    cache.lastUpdated = new Date();

    const duration = Date.now() - startTime;
    logger.info('Teams cache refreshed', {
      teamsCount: teams.length,
      duration: `${duration}ms`,
    });
  } catch (error) {
    logger.error('Failed to refresh teams cache', { error });
  }
}

/**
 * Gets teams from cache (returns empty array if cache not initialized)
 */
export function getCachedTeams(): Team[] {
  return cache.teams;
}

/**
 * Gets cache status information
 */
export function getCacheInfo(): { teamsCount: number; lastUpdated: Date | null } {
  return {
    teamsCount: cache.teams.length,
    lastUpdated: cache.lastUpdated,
  };
}

/**
 * Initializes the teams cache and starts periodic refresh
 */
export async function initializeTeamsCache(): Promise<void> {
  logger.info('Initializing teams cache...');

  // Initial fetch
  await refreshTeamsCache();

  // Set up periodic refresh
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = setInterval(() => {
    refreshTeamsCache();
  }, REFRESH_INTERVAL_MS);

  logger.info('Teams cache auto-refresh scheduled', {
    intervalMinutes: REFRESH_INTERVAL_MS / 60000,
  });
}

/**
 * Stops the periodic refresh (for graceful shutdown)
 */
export function stopTeamsCache(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    logger.info('Teams cache auto-refresh stopped');
  }
}
