/**
 * Environment configuration loader with validation
 */

import { config } from 'dotenv';
import { EnvConfig } from '../types/env';

// Load .env file
config();

/**
 * Validates and returns environment configuration
 * Throws error if required variables are missing
 */
export function loadEnvConfig(): EnvConfig {
  const requiredVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET',
    'NOTION_TOKEN',
    'NOTION_DB_ID',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  return {
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
    SLACK_DIGEST_CHANNEL_ID: process.env.SLACK_DIGEST_CHANNEL_ID,
    NOTION_TOKEN: process.env.NOTION_TOKEN!,
    NOTION_DB_ID: process.env.NOTION_DB_ID!,
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: (process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'],
  };
}

// Export singleton config instance
export const env = loadEnvConfig();
