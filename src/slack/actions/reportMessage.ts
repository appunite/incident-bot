/**
 * Message action handler for "Report as Incident"
 * Allows users to convert existing Slack messages into incidents
 */

import { createModuleLogger } from '../../utils/logger';
import { createIncidentModal } from '../views/incidentModal';
import { handleError } from '../../utils/errorHandler';
import { getCachedTeams } from '../../notion/teamsCache';

const logger = createModuleLogger('report-message-action');

/**
 * Handles "Report as Incident" message shortcut
 * Opens modal pre-filled with message content
 */
export async function handleReportMessage({
  shortcut,
  ack,
  client,
  body,
}: any): Promise<void> {
  try {
    // Acknowledge IMMEDIATELY - must be within 3 seconds
    await ack();

    // Extract message details from the shortcut payload
    const message = shortcut.message;
    const channelId = shortcut.channel.id;
    const messageTs = message.ts;
    const messageText = message.text || '';

    // Determine if message is already in a thread
    const threadTs = message.thread_ts || messageTs;

    logger.info('Report as Incident action triggered', {
      userId: body.user.id,
      channelId,
      messageTs,
      threadTs,
    });

    // Create metadata to pass original message context
    const privateMetadata = JSON.stringify({
      sourceChannelId: channelId,
      sourceMessageTs: messageTs,
      sourceThreadTs: threadTs,
    });

    // Get teams from cache (instant, no API call)
    const teams = getCachedTeams();
    logger.info('Teams from cache for modal', { teamsCount: teams.length });

    // Open the modal with message text pre-filled
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createIncidentModal({
        initialTitle: messageText.substring(0, 200), // Respect title max length
        initialDescription: messageText,
        privateMetadata,
        teams,
      }),
    });

    logger.info('Incident modal opened from message action', {
      userId: body.user.id,
      channelId,
    });
  } catch (error) {
    logger.error('Failed to handle report message action', {
      error,
      userId: body.user.id,
    });

    const errorMessage = handleError(error, 'report message action');

    // Try to send error message to user
    try {
      await client.chat.postEphemeral({
        channel: body.channel?.id || body.user.id,
        user: body.user.id,
        text: `❌ Failed to open incident form: ${errorMessage}`,
      });
    } catch (messageError) {
      logger.error('Failed to send error message', { error: messageError });
    }
  }
}
