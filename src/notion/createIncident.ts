/**
 * Creates incident in Notion database
 */

import { notionClient, INCIDENTS_DB_ID } from './client';
import { IncidentFormData, ThreadMessage } from '../types/incident';
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
 * @param data - Incident form data from Slack
 * @param threadMessages - Optional thread messages to append
 */
export async function createIncident(
  data: IncidentFormData,
  threadMessages?: ThreadMessage[]
): Promise<CreateIncidentResult> {
  try {
    logger.info('Creating incident in Notion', {
      title: data.title,
      severity: data.severity,
      area: data.area,
    });

    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      },
      Description: {
        rich_text: [
          {
            text: {
              content: data.description.substring(0, 2000),
            },
          },
        ],
      },
      Status: {
        status: {
          name: 'Open',
        },
      },
      Severity: {
        select: {
          name: data.severity,
        },
      },
      Area: {
        select: {
          name: data.area,
        },
      },
      'Detected Date': {
        date: {
          start: new Date().toISOString(),
        },
      },
      'Created From': {
        select: {
          name: 'Automatic',
        },
      },
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

    if (data.reporterNotionId) {
      properties.Reporter = {
        people: [{ id: data.reporterNotionId }],
      };
    }

    if (data.happenedDate) {
      properties['Happened Date'] = {
        date: {
          start: data.happenedDate,
        },
      };
    }

    if (data.discoverDate) {
      properties['Discover Date'] = {
        date: {
          start: data.discoverDate,
        },
      };
    }

    if (data.dueDate) {
      properties['Due Date'] = {
        date: {
          start: data.dueDate,
        },
      };
    }

    if (data.teamIds && data.teamIds.length > 0) {
      properties.Teams = {
        relation: data.teamIds.map((id) => ({ id })),
      };
    }

    if (data.slackChannelId) {
      properties['Slack Channel ID'] = {
        rich_text: [
          {
            text: {
              content: data.slackChannelId,
            },
          },
        ],
      };
    }

    const response = await notionClient.pages.create({
      parent: {
        database_id: INCIDENTS_DB_ID,
      },
      properties,
    });

    logger.info('Notion page created successfully', {
      pageId: response.id,
    });

    try {
      const templateBlocks = buildIncidentPageBlocks({
        description: data.description,
        whyItMatters: data.whyItMatters,
        threadMessages,
      });

      await notionClient.blocks.children.append({
        block_id: response.id,
        children: templateBlocks,
      });

      logger.info('Page content appended', {
        blockCount: templateBlocks.length,
      });
    } catch (appendError) {
      logger.error('Failed to append page content', {
        error: appendError,
        pageId: response.id,
      });
    }

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
