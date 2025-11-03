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
    logger.info('Looking up Notion user by email', { email });

    // Query all users in the Notion workspace
    const response = await notionClient.users.list({});

    // Find user with matching email
    const matchingUser = response.results.find((user) => {
      // Check if user has an email (only Person type users have emails)
      if (user.type === 'person' && 'person' in user && user.person.email) {
        return user.person.email.toLowerCase() === email.toLowerCase();
      }
      return false;
    });

    if (matchingUser) {
      logger.info('Found matching Notion user', {
        email,
        notionUserId: matchingUser.id,
      });
      return matchingUser.id;
    }

    logger.warn('No matching Notion user found for email', { email });
    return undefined;
  } catch (error) {
    logger.error('Failed to find Notion user by email', {
      error,
      email,
    });
    return undefined;
  }
}
