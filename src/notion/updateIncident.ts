/**
 * Updates incident in Notion database
 */

import { notionClient } from './client';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('notion-update');

interface UpdateSlackThreadOptions {
  notionPageId: string;
  slackThreadUrl: string;
  slackMessageTs: string;
  slackChannelId: string;
}

/**
 * Updates Notion page with Slack thread information
 */
export async function updateIncidentWithSlackThread({
  notionPageId,
  slackThreadUrl,
  slackMessageTs,
  slackChannelId,
}: UpdateSlackThreadOptions): Promise<void> {
  try {
    logger.info('Updating Notion page with Slack thread info', {
      notionPageId,
      slackThreadUrl,
      slackChannelId,
    });

    // Update properties
    await notionClient.pages.update({
      page_id: notionPageId,
      properties: {
        // Slack Message URL (url type)
        'Slack Message URL': {
          url: slackThreadUrl,
        },
        // Slack Thread ID (text type)
        'Slack Thread ID': {
          rich_text: [
            {
              text: {
                content: slackMessageTs,
              },
            },
          ],
        },
        // Slack Channel ID (text type)
        'Slack Channel ID': {
          rich_text: [
            {
              text: {
                content: slackChannelId,
              },
            },
          ],
        },
        // Last Synced (date type) - track when we last synced with Slack
        'Last Synced': {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    // Also update the first Slack thread bullet in the "Related" section
    // Get all blocks from the page
    const pageBlocks = await notionClient.blocks.children.list({
      block_id: notionPageId,
    });

    // Find the first bullet point in the Related section (after the last heading_1)
    // We need to find and update the "Slack thread" bullet point
    let slackBulletBlockId: string | undefined;

    // Look for a bulleted_list_item that contains "Slack thread"
    for (const block of pageBlocks.results) {
      if (
        'type' in block &&
        block.type === 'bulleted_list_item' &&
        'bulleted_list_item' in block &&
        block.bulleted_list_item.rich_text &&
        block.bulleted_list_item.rich_text.length > 0 &&
        block.bulleted_list_item.rich_text[0].plain_text?.includes('Slack thread')
      ) {
        slackBulletBlockId = block.id;
        break;
      }
    }

    // Update the Slack thread bullet with the actual link
    if (slackBulletBlockId) {
      await notionClient.blocks.update({
        block_id: slackBulletBlockId,
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Slack thread: ' },
            },
            {
              type: 'text',
              text: {
                content: 'View in Slack',
                link: { url: slackThreadUrl }
              },
              annotations: { color: 'blue' },
            },
          ],
        },
      });
    }

    logger.info('Notion page updated with Slack thread info', {
      notionPageId,
    });
  } catch (error) {
    logger.error('Failed to update Notion page with Slack thread info', {
      error,
      notionPageId,
    });
    // Don't throw - this is not critical, incident is already created
    // Just log the error
  }
}
