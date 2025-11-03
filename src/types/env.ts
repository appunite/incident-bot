/**
 * Environment variable types
 */

export interface EnvConfig {
  // Slack
  SLACK_BOT_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_DIGEST_CHANNEL_ID?: string;

  // Notion
  NOTION_TOKEN: string;
  NOTION_DB_ID: string;
  NOTION_TEAMS_DB_ID?: string;

  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
}
