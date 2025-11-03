/**
 * /incident slash command handler
 * Opens modal for incident creation
 */

import { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { createModuleLogger } from '../../utils/logger';
import { createIncidentModal } from '../views/incidentModal';
import { handleError } from '../../utils/errorHandler';

const logger = createModuleLogger('incident-command');

/**
 * Handles /incident slash command
 * Opens the incident creation modal
 */
export async function handleIncidentCommand({
  command,
  ack,
  client,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  try {
    // Acknowledge the command request immediately
    await ack();

    logger.info('Opening incident modal', {
      userId: command.user_id,
      channelId: command.channel_id,
    });

    // Open the modal
    await client.views.open({
      trigger_id: command.trigger_id,
      view: createIncidentModal(),
    });

    logger.info('Incident modal opened successfully', {
      userId: command.user_id,
    });
  } catch (error) {
    logger.error('Failed to open incident modal', {
      error,
      userId: command.user_id,
    });

    const errorMessage = handleError(error, 'incident command');

    // Try to send error message to user
    try {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `❌ Failed to open incident form: ${errorMessage}`,
      });
    } catch (messageError) {
      logger.error('Failed to send error message', { error: messageError });
    }
  }
}
