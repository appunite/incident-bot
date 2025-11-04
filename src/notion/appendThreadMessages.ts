/**
 * Appends thread messages to an existing Notion page
 * This is done separately from page creation to avoid timeout on large payloads
 */

import { notionClient } from './client';
import { ThreadMessage } from '../types/incident';
import { createModuleLogger } from '../utils/logger';
import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

const logger = createModuleLogger('notion-append-thread');

/**
 * Appends thread messages to an existing Notion page
 * Uses blocks.children.append API to add content after page creation
 *
 * @param pageId - The Notion page ID to append to
 * @param threadMessages - Array of thread messages to add
 */
export async function appendThreadMessages(
  pageId: string,
  threadMessages: ThreadMessage[]
): Promise<void> {
  if (!threadMessages || threadMessages.length === 0) {
    logger.info('No thread messages to append');
    return;
  }

  try {
    logger.info('Appending thread messages to Notion page', {
      pageId,
      messageCount: threadMessages.length,
    });

    // Build thread context blocks
    const messageCount = threadMessages.length;
    const toggleTitle = `💬 Thread Context (${messageCount} message${messageCount > 1 ? 's' : ''})`;

    // Create quote blocks for each thread message
    const toggleChildren = threadMessages.map((msg) => ({
      object: 'block' as const,
      type: 'quote' as const,
      quote: {
        rich_text: [
          {
            type: 'text' as const,
            text: {
              content: `${msg.userName} • ${msg.formattedTime}\n${msg.text}`,
            },
          },
        ],
        color: 'gray' as const,
      },
    }));

    // Create toggle block with thread messages
    const toggleBlock: BlockObjectRequest = {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [
          {
            type: 'text',
            text: { content: toggleTitle },
            annotations: { bold: true },
          },
        ],
        children: toggleChildren as any,
      },
    };

    // Find the "What Happened" section and append after it
    // For now, we'll just append to the end of the page
    await notionClient.blocks.children.append({
      block_id: pageId,
      children: [
        // Add divider before thread context
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
        toggleBlock,
      ],
    });

    logger.info('Thread messages appended successfully', {
      pageId,
      messageCount: threadMessages.length,
    });
  } catch (error) {
    logger.error('Failed to append thread messages (non-critical)', {
      error,
      pageId,
      messageCount: threadMessages.length,
    });
    // Don't throw - this is non-critical, incident was already created
  }
}
