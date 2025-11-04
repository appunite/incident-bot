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
        'Slack Thread URL': {
          url: threadUrl,
        },
        'Slack Message TS': {
          rich_text: [
            {
              text: {
                content: slackInfo.messageTs,
              },
            },
          ],
        },
      },
    });

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
