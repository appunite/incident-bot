/**
 * Incident Bot - Main Entry Point
 * Slack + Notion integration for incident management
 */

import { env } from './config/env';
import { logger } from './utils/logger';
import { slackApp, expressApp } from './slack/client';
import { notionClient } from './notion/client';
import { handleIncidentCommand } from './slack/commands/incident';
import { handleIncidentSubmission } from './slack/handlers/incidentSubmission';

const startupLogger = logger.child({ module: 'startup' });

// Register Slack command handlers
slackApp.command('/incident', handleIncidentCommand);

// Register view submission handlers
slackApp.view('incident_modal', handleIncidentSubmission);

startupLogger.info('Slack handlers registered');

/**
 * Health check endpoint
 */
expressApp.get('/health', async (_req, res) => {
  try {
    // Check Slack connection
    const slackAuth = await slackApp.client.auth.test();

    // Check Notion connection
    await notionClient.databases.retrieve({ database_id: env.NOTION_DB_ID });

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      slack: {
        connected: true,
        team: slackAuth.team,
        user: slackAuth.user,
      },
      notion: {
        connected: true,
      },
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Health check failed:', { error: err.message });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

/**
 * Root endpoint
 */
expressApp.get('/', (_req, res) => {
  res.json({
    name: 'Incident Bot',
    version: '1.0.0',
    description: 'Slack + Notion integration for incident management',
    endpoints: {
      health: '/health',
      slack: '/slack/events',
    },
  });
});

/**
 * Start the server
 */
async function start() {
  try {
    startupLogger.info('Starting Incident Bot...');
    startupLogger.info(`Environment: ${env.NODE_ENV}`);
    startupLogger.info(`Port: ${env.PORT}`);

    // Start Slack Bolt receiver (includes Express server)
    await slackApp.start(env.PORT);

    startupLogger.info(`⚡️ Incident Bot is running on port ${env.PORT}`);
    startupLogger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
    startupLogger.info(`📱 Slack events: http://localhost:${env.PORT}/slack/events`);
  } catch (error) {
    startupLogger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  startupLogger.info('Shutting down gracefully...');
  await slackApp.stop();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the application
start();
