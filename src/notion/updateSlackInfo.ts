/**
 * Updates Notion incident page with Slack thread information
 */

import { notionClient } from './client';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('notion-slack-update');

export interface SlackThreadInfo {
  channelId: string;
  messageTs: string;
  workspaceDomain?: string;
}

/**
 * Constructs Slack thread URL from channel ID and message timestamp
 */
function buildSlackThreadUrl(channelId: string, messageTs: string, workspaceDomain?: string): string {
  const tsWithoutDot = messageTs.replace('.', '');
  const domain = workspaceDomain || 'app';
  return `https://${domain}.slack.com/archives/${channelId}/p${tsWithoutDot}`;
}

/**
 * Updates Notion page with Slack thread URL and message timestamp
 */
export async function updateNotionPageWithSlackInfo(
  pageId: string,
  slackInfo: SlackThreadInfo
): Promise<void> {
  try {
    const threadUrl = buildSlackThreadUrl(
      slackInfo.channelId,
      slackInfo.messageTs,
      slackInfo.workspaceDomain
    );

    logger.info('Updating Notion page with Slack info', {
      pageId,
      threadUrl,
      channelId: slackInfo.channelId,
      messageTs: slackInfo.messageTs,
    });

    await notionClient.pages.update({
      page_id: pageId,
      properties: {
        'Slack Message URL': {
          url: threadUrl,
        },
        'Slack Thread ID': {
          rich_text: [
            {
              text: {
                content: slackInfo.messageTs,
              },
            },
          ],
        },
        'Slack Channel ID': {
          rich_text: [
            {
              text: {
                content: slackInfo.channelId,
              },
            },
          ],
        },
      },
    });

    // Also update the Slack thread bullet point in the "Related" section
    try {
      const pageBlocks = await notionClient.blocks.children.list({
        block_id: pageId,
      });

      // Find the bullet point that contains "Slack thread"
      let slackBulletBlockId: string | undefined;

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
                  link: { url: threadUrl },
                },
                annotations: { color: 'blue' },
              },
            ],
          },
        });

        logger.info('Updated Slack thread link in page content', {
          pageId,
          blockId: slackBulletBlockId,
        });
      } else {
        logger.warn('Could not find Slack thread bullet point to update', {
          pageId,
        });
      }
    } catch (blockUpdateError) {
      logger.warn('Failed to update Slack thread link in page content', {
        error: blockUpdateError,
        pageId,
      });
      // Don't throw - property update succeeded, block update is secondary
    }

    logger.info('Successfully updated Notion page with Slack info', {
      pageId,
      threadUrl,
    });
  } catch (error) {
    logger.error('Failed to update Notion page with Slack info', {
      error,
      pageId,
      slackInfo,
    });
  }
}
