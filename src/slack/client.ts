/**
 * Slack Bolt App initialization
 */

import { App, ExpressReceiver, LogLevel } from '@slack/bolt';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const slackLogger = logger.child({ module: 'slack' });

// Create Express receiver for custom route handling
export const receiver = new ExpressReceiver({
  signingSecret: env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events',
});

// Log ALL incoming requests for debugging
receiver.app.use('/slack/events', (req, _res, next) => {
  slackLogger.info('🔵 REQUEST to /slack/events', {
    method: req.method,
    path: req.path,
    body: req.body?.type || 'no type',
    hasPayload: !!req.body?.payload,
  });
  next();
});

// Initialize Slack Bolt app
export const slackApp = new App({
  token: env.SLACK_BOT_TOKEN,
  receiver,
  // Custom logger integration
  logLevel: env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
});

slackLogger.info('Slack Bolt app initialized');

// Export Express app for custom routes
export const expressApp = receiver.app;
