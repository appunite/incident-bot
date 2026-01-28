/**
 * Query unassigned incidents from Notion database
 */

import { notionClient, INCIDENTS_DB_ID } from '../client';
import { createModuleLogger } from '../../utils/logger';
import { IncidentSeverity, IncidentArea } from '../../types/incident';

const logger = createModuleLogger('unassigned-incidents');

export interface UnassignedIncident {
  id: string;
  url: string;
  title: string;
  severity: IncidentSeverity;
  status: 'Open' | 'In Progress' | 'Ready for Review';
  area: IncidentArea;
  discoverDate: string;
  daysSinceCreation: number;
  teamIds?: string[];
}

/**
 * Fetches all unassigned incidents from Notion
 * Filters for incidents where Owner is empty and Status is Open or In Progress
 * Sorts by Discover Date (oldest first)
 */
export async function getUnassignedIncidents(): Promise<UnassignedIncident[]> {
  try {
    logger.info('Querying unassigned incidents from Notion');

    const response = await notionClient.databases.query({
      database_id: INCIDENTS_DB_ID,
      filter: {
        and: [
          {
            property: 'Owner',
            people: {
              is_empty: true,
            },
          },
          {
            or: [
              {
                property: 'Status',
                status: {
                  equals: 'Open',
                },
              },
              {
                property: 'Status',
                status: {
                  equals: 'In Progress',
                },
              },
              {
                property: 'Status',
                status: {
                  equals: 'Ready for Review',
                },
              },
            ],
          },
        ],
      },
      sorts: [
        {
          property: 'Discover Date',
          direction: 'ascending',
        },
      ],
    });

    const incidents: UnassignedIncident[] = response.results.map((page: any) => {
      // Extract properties
      const title = page.properties.Title?.title?.[0]?.plain_text || 'Untitled';
      const severity = page.properties.Severity?.select?.name || 'Normal';
      const status = page.properties.Status?.status?.name || 'Open';
      const area = page.properties.Area?.select?.name || 'Internal';
      const discoverDateStr = page.properties['Discover Date']?.date?.start;
      const teamIds = page.properties.Teams?.relation?.map((rel: any) => rel.id) || [];

      // Calculate days since creation
      let daysSinceCreation = 0;
      if (discoverDateStr) {
        const discoverDate = new Date(discoverDateStr);
        const now = new Date();
        const diffTime = now.getTime() - discoverDate.getTime();
        daysSinceCreation = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Build Notion URL
      const url = `https://notion.so/${page.id.replace(/-/g, '')}`;

      return {
        id: page.id,
        url,
        title,
        severity: severity as IncidentSeverity,
        status: status as 'Open' | 'In Progress' | 'Ready for Review',
        area: area as IncidentArea,
        discoverDate: discoverDateStr || new Date().toISOString(),
        daysSinceCreation,
        teamIds: teamIds.length > 0 ? teamIds : undefined,
      };
    });

    logger.info('Unassigned incidents fetched', {
      count: incidents.length,
    });

    return incidents;
  } catch (error) {
    logger.error('Failed to fetch unassigned incidents', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
