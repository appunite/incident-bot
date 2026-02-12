/**
 * Query incidents for daily digest from Notion database
 */

import { notionClient, INCIDENTS_DB_ID } from '../client';
import { createModuleLogger } from '../../utils/logger';
import { IncidentSeverity, IncidentArea } from '../../types/incident';

const logger = createModuleLogger('digest-incidents');

export type DigestIncidentStatus = 'Open' | 'In Progress' | 'Ready for Review';

export interface DigestIncident {
  id: string;
  url: string;
  title: string;
  severity: IncidentSeverity;
  status: DigestIncidentStatus;
  area: IncidentArea;
  discoverDate: string;
  daysSinceCreation: number;
  lastEditedTime: string;
  daysSinceLastUpdate: number;
  ownerNotionId?: string;
  ownerName?: string;
  ownerEmail?: string;
  teamIds?: string[];
}

/**
 * Fetches all active incidents for digest processing.
 * Includes incidents in Open, In Progress, and Ready for Review.
 * Sorts by Discover Date (oldest first)
 */
export async function getDigestIncidents(): Promise<DigestIncident[]> {
  try {
    logger.info('Querying digest incidents from Notion');

    const response = await notionClient.databases.query({
      database_id: INCIDENTS_DB_ID,
      filter: {
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
      sorts: [
        {
          property: 'Discover Date',
          direction: 'ascending',
        },
      ],
    });

    const now = new Date();
    const incidents: DigestIncident[] = response.results.map((page: any) => {
      const title = page.properties.Title?.title?.[0]?.plain_text || 'Untitled';
      const severity = page.properties.Severity?.select?.name || 'Normal';
      const status = page.properties.Status?.status?.name || 'Open';
      const area = page.properties.Area?.select?.name || 'Internal';
      const discoverDateStr = page.properties['Discover Date']?.date?.start;
      const teamIds = page.properties.Teams?.relation?.map((rel: any) => rel.id) || [];

      const owner = page.properties.Owner?.people?.[0];
      const ownerNotionId = owner?.id;
      const ownerName = owner?.name;
      const ownerEmail = owner?.person?.email;

      const lastEditedTime = page.last_edited_time || new Date().toISOString();

      // Calculate days since creation
      let daysSinceCreation = 0;
      if (discoverDateStr) {
        const discoverDate = new Date(discoverDateStr);
        const diffTime = now.getTime() - discoverDate.getTime();
        daysSinceCreation = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate days since last update
      const lastUpdateDate = new Date(lastEditedTime);
      const diffSinceLastUpdate = now.getTime() - lastUpdateDate.getTime();
      const daysSinceLastUpdate = Math.floor(diffSinceLastUpdate / (1000 * 60 * 60 * 24));

      const url = `https://notion.so/${page.id.replace(/-/g, '')}`;

      return {
        id: page.id,
        url,
        title,
        severity: severity as IncidentSeverity,
        status: status as DigestIncidentStatus,
        area: area as IncidentArea,
        discoverDate: discoverDateStr || new Date().toISOString(),
        daysSinceCreation,
        lastEditedTime,
        daysSinceLastUpdate,
        ownerNotionId,
        ownerName,
        ownerEmail,
        teamIds: teamIds.length > 0 ? teamIds : undefined,
      };
    });

    logger.info('Digest incidents fetched', {
      count: incidents.length,
    });

    return incidents;
  } catch (error) {
    logger.error('Failed to fetch digest incidents', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
