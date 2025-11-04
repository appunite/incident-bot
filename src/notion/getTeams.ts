/**
 * Query teams from Notion Teams database
 */

import { notionClient } from './client';
import { createModuleLogger } from '../utils/logger';
import { env } from '../config/env';

const logger = createModuleLogger('notion-teams');

export interface Team {
  id: string;
  name: string;
}

/**
 * Fetches all teams from the Notion Teams database
 * @returns Array of teams with id and name, or empty array if Teams DB not configured
 */
export async function getTeams(): Promise<Team[]> {
  try {
    // Check if Teams DB is configured
    if (!env.NOTION_TEAMS_DB_ID) {
      logger.warn('NOTION_TEAMS_DB_ID not configured, team selection unavailable');
      return [];
    }

    logger.info('Fetching teams from Notion', { dbId: env.NOTION_TEAMS_DB_ID });

    // Query the Teams database - only fetch active teams
    const response = await notionClient.databases.query({
      database_id: env.NOTION_TEAMS_DB_ID,
      filter: {
        property: 'Active',
        checkbox: {
          equals: true,
        },
      },
    });

    // Extract team names from page titles
    const teams: Team[] = response.results.map((page: any) => {
      // Check for common title property names: Team, Name, Title
      const titleProperty = page.properties.Team || page.properties.Name || page.properties.Title;
      let name = 'Unnamed Team';

      if (titleProperty?.title?.[0]?.plain_text) {
        name = titleProperty.title[0].plain_text;
      }

      return {
        id: page.id,
        name,
      };
    });

    logger.info('Teams fetched successfully', { count: teams.length });
    return teams;
  } catch (error) {
    logger.error('Failed to fetch teams from Notion', {
      error,
      dbId: env.NOTION_TEAMS_DB_ID,
    });
    // Return empty array on error (graceful degradation)
    return [];
  }
}
