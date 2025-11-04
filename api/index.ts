/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app for Vercel's serverless environment
 */

import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { slackApp, expressApp } from '../src/slack/client';
import { notionClient } from '../src/notion/client';
import { handleIncidentCommand } from '../src/slack/commands/incident';
import { handleIncidentSubmission } from '../src/slack/handlers/incidentSubmission';
import { handleReportMessage } from '../src/slack/actions/reportMessage';
import { initializeTeamsCache } from '../src/notion/teamsCache';

const startupLogger = logger.child({ module: 'serverless' });

// Register Slack command handlers
slackApp.command('/incident', handleIncidentCommand);

// Register message shortcut handlers
slackApp.shortcut('report_as_incident', handleReportMessage);

// Register view submission handlers
slackApp.view('incident_modal', handleIncidentSubmission);

startupLogger.info('Slack handlers registered for serverless');

// Initialize teams cache (best effort, may not persist between function invocations)
initializeTeamsCache().catch((error) => {
  startupLogger.warn('Teams cache initialization failed (expected in serverless):', error);
});

// Debug middleware to log ALL requests
expressApp.use((req, res, next) => {
  logger.info('🔍 Incoming request', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    headers: Object.keys(req.headers),
    hasSlackSignature: !!req.headers['x-slack-signature'],
  });
  next();
});

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
    environment: 'serverless',
    endpoints: {
      health: '/health',
      slack: '/slack/events',
    },
  });
});

// Export the Express app for Vercel
// Vercel will handle requests by invoking this exported app
export default expressApp;
