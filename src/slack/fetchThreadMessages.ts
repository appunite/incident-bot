/**
 * Fetches thread messages from Slack
 * Used when creating incidents from threaded messages
 */

import { WebClient } from '@slack/web-api';
import { logger } from '../utils/logger';
import type { ThreadMessage } from '../types/incident';

const threadLogger = logger.child({ module: 'thread-messages' });

// Simple in-memory cache for user names to reduce API calls
const userNameCache = new Map<string, string>();

/**
 * Fetches user display name from Slack
 * Uses cache to minimize API calls
 */
async function getUserName(
  client: WebClient,
  userId: string
): Promise<string> {
  // Check cache first
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId)!;
  }

  try {
    const userInfo = await client.users.info({ user: userId });
    const userName =
      userInfo.user?.profile?.display_name ||
      userInfo.user?.real_name ||
      'Unknown User';

    // Cache the result
    userNameCache.set(userId, userName);
    return userName;
  } catch (error) {
    threadLogger.warn('Failed to fetch user info', { userId, error });
    return 'Unknown User';
  }
}

export interface ThreadMessagesResult {
  messages: ThreadMessage[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Fetches all messages from a Slack thread
 * @param client - Slack WebClient instance
 * @param channelId - Slack channel ID
 * @param threadTs - Thread parent timestamp
 * @param limit - Maximum number of messages to fetch (default 30)
 * @returns Thread messages with formatted user info, or null if error
 */
export async function fetchThreadMessages(
  client: WebClient,
  channelId: string,
  threadTs: string,
  limit: number = 30
): Promise<ThreadMessagesResult | null> {
  try {
    threadLogger.info('Fetching thread messages', {
      channelId,
      threadTs,
      limit,
    });

    const response = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      limit,
    });

    if (!response.ok || !response.messages) {
      threadLogger.error('Failed to fetch thread messages', {
        error: response.error,
      });
      return null;
    }

    const messages = response.messages;

    // Skip the first message (parent) since it's already in description
    const threadReplies = messages.slice(1);

    if (threadReplies.length === 0) {
      threadLogger.info('No thread replies found (only parent message)');
      return {
        messages: [],
        totalCount: 0,
        hasMore: false,
      };
    }

    // Format messages with user info
    const formattedMessages: ThreadMessage[] = await Promise.all(
      threadReplies.map(async (msg) => {
        // Fetch user display name
        let userName = 'Unknown User';
        if (msg.user) {
          userName = await getUserName(client, msg.user);
        }

        // Format timestamp as readable time
        const timestamp = msg.ts || '';
        const date = new Date(parseFloat(timestamp) * 1000);
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return {
          user: msg.user || 'unknown',
          userName,
          text: msg.text || '',
          timestamp,
          formattedTime,
        };
      })
    );

    threadLogger.info('Successfully fetched thread messages', {
      totalMessages: formattedMessages.length,
      hasMore: response.has_more || false,
    });

    return {
      messages: formattedMessages,
      totalCount: formattedMessages.length,
      hasMore: response.has_more || false,
    };
  } catch (error) {
    threadLogger.error('Error fetching thread messages', {
      error,
      channelId,
      threadTs,
    });
    return null;
  }
}
