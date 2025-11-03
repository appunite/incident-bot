/**
 * Creates incident in Notion database
 */

import { notionClient, INCIDENTS_DB_ID } from './client';
import { IncidentFormData } from '../types/incident';
import { createModuleLogger } from '../utils/logger';
import { buildIncidentPageBlocks } from './pageTemplate';

const logger = createModuleLogger('notion-create');

interface CreateIncidentResult {
  id: string;
  url: string;
  success: boolean;
}

/**
 * Creates a new incident page in Notion database
 */
export async function createIncident(
  data: IncidentFormData
): Promise<CreateIncidentResult> {
  try {
    logger.info('Creating incident in Notion', {
      title: data.title,
      severity: data.severity,
      area: data.area,
    });

    const properties: any = {
      // Title property (title type)
      Title: {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      },
      // Description (text type) - keeping as property for quick reference/filtering
      Description: {
        rich_text: [
          {
            text: {
              content: data.description.substring(0, 2000), // Truncate to first 2000 chars for property
            },
          },
        ],
      },
      // Status (status type) - Notion's built-in status property
      Status: {
        status: {
          name: 'Open',
        },
      },
      // Severity (select type)
      Severity: {
        select: {
          name: data.severity,
        },
      },
      // Area (select type)
      Area: {
        select: {
          name: data.area,
        },
      },
      // Detected Date (date type) - when incident was detected/reported
      'Detected Date': {
        date: {
          start: new Date().toISOString(),
        },
      },
      // Created From (select type) - origin of the incident record
      'Created From': {
        select: {
          name: 'Automatic',
        },
      },
      // Trigger (text type) - how this incident was triggered
      Trigger: {
        rich_text: [
          {
            text: {
              content: 'Slack /incident command',
            },
          },
        ],
      },
    };

    // Add Reporter field if Notion user was found
    if (data.reporterNotionId) {
      properties.Reporter = {
        people: [{ id: data.reporterNotionId }],
      };
    }

    // Add Happened Date if provided
    if (data.happenedDate) {
      properties['Happened Date'] = {
        date: {
          start: data.happenedDate, // Already in YYYY-MM-DD format from datepicker
        },
      };
    }

    // Add Due Date if provided
    if (data.dueDate) {
      properties['Due Date'] = {
        date: {
          start: data.dueDate, // Already in YYYY-MM-DD format from datepicker
        },
      };
    }

    const response = await notionClient.pages.create({
      parent: {
        database_id: INCIDENTS_DB_ID,
      },
      properties,
      // Add structured page content using template
      children: buildIncidentPageBlocks({
        description: data.description,
      }),
    });

    // Construct Notion page URL
    const pageUrl = `https://notion.so/${response.id.replace(/-/g, '')}`;

    logger.info('Incident created successfully in Notion', {
      notionPageId: response.id,
      url: pageUrl,
    });

    return {
      id: response.id,
      url: pageUrl,
      success: true,
    };
  } catch (error) {
    logger.error('Failed to create incident in Notion', {
      error,
      title: data.title,
    });
    throw error;
  }
}
