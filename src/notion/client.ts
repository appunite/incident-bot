/**
 * Notion API client initialization
 */

import { Client } from '@notionhq/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const notionLogger = logger.child({ module: 'notion' });

// Initialize Notion client
export const notionClient = new Client({
  auth: env.NOTION_TOKEN,
});

notionLogger.info('Notion client initialized');

// Export database ID for easy access
export const INCIDENTS_DB_ID = env.NOTION_DB_ID;
