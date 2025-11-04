/**
 * Find Notion user by email
 */

import { notionClient } from './client';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('notion-user');

/**
 * Finds a Notion user by email address
 * @param email - User's email address from Slack
 * @returns Notion user ID if found, undefined otherwise
 */
export async function findNotionUserByEmail(
  email: string
): Promise<string | undefined> {
  try {
    // Query all users in the Notion workspace with pagination
    let cursor: string | undefined = undefined;

    do {
      const response = await notionClient.users.list({
        start_cursor: cursor,
      });

      // Find user with matching email in this page
      const matchingUser = response.results.find((user) => {
        // Check if user has an email (only Person type users have emails)
        if (user.type === 'person' && 'person' in user && user.person.email) {
          return user.person.email.toLowerCase() === email.toLowerCase();
        }
        return false;
      });

      if (matchingUser) {
        logger.info('Found Notion user by email', {
          notionUserId: matchingUser.id,
        });
        return matchingUser.id;
      }

      // Move to next page if available
      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return undefined;
  } catch (error) {
    logger.error('Failed to find Notion user by email', {
      error,
      email,
    });
    return undefined;
  }
}

/**
 * Finds a Notion user by name (fallback when email not available)
 * @param name - User's name from Slack
 * @returns Notion user ID if found, undefined otherwise
 */
export async function findNotionUserByName(
  name: string
): Promise<string | undefined> {
  try {
    // Normalize name for comparison
    const normalizedSearchName = name.toLowerCase().trim();

    // Query all users in the Notion workspace with pagination
    let cursor: string | undefined = undefined;

    do {
      const response = await notionClient.users.list({
        start_cursor: cursor,
      });

      // Find user with matching name in this page
      const matchingUser = response.results.find((user) => {
        if (user.type === 'person' && 'person' in user && user.name) {
          const notionName = user.name.toLowerCase().trim();
          // Try exact match first, then partial match
          return (
            notionName === normalizedSearchName ||
            notionName.includes(normalizedSearchName) ||
            normalizedSearchName.includes(notionName)
          );
        }
        return false;
      });

      if (matchingUser) {
        logger.info('Found Notion user by name', {
          notionUserId: matchingUser.id,
        });
        return matchingUser.id;
      }

      // Move to next page if available
      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return undefined;
  } catch (error) {
    logger.error('Failed to find Notion user by name', {
      error,
      name,
    });
    return undefined;
  }
}
