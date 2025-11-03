/**
 * Modal submission handler for incident creation
 */

import { SlackViewMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { createModuleLogger } from '../../utils/logger';
import { createIncident } from '../../notion/createIncident';
import { IncidentFormData } from '../../types/incident';
import { slackApp } from '../client';
import { createConfirmationMessage } from '../messages/confirmationMessage';
import { updateIncidentWithSlackThread } from '../../notion/updateIncident';

const logger = createModuleLogger('incident-submission');

/**
 * Handles incident modal submission
 */
export async function handleIncidentSubmission({
  ack,
  view,
  body,
  client,
}: SlackViewMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  try {
    logger.info('Incident submission received', {
      userId: body.user.id,
      viewId: view.id,
    });

    // Acknowledge immediately
    await ack();

    // Extract form data from modal submission
    const values = view.state.values;
    const title = values.title_block?.title_input?.value || '';
    const description = values.description_block?.description_input?.value || '';
    const severity = values.severity_block?.severity_input?.selected_option?.value as IncidentFormData['severity'];
    const area = values.area_block?.area_input?.selected_option?.value as IncidentFormData['area'];

    // Get user info
    const userInfo = await client.users.info({ user: body.user.id });
    const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';

    // Get channel info - use the channel where the command was invoked
    const channelId = body.view.private_metadata || body.user.id;

    logger.info('Form data extracted', {
      title,
      severity,
      area,
      userName,
    });

    // Prepare incident data
    const incidentData: IncidentFormData = {
      title,
      description,
      severity,
      area,
      createdBy: body.user.id,
      createdByName: userName,
      slackChannelId: channelId,
      slackChannelName: 'DM',
    };

    // Create incident in Notion
    logger.info('Creating incident in Notion');
    const notionResult = await createIncident(incidentData);

    // Post confirmation message to Slack channel
    logger.info('Posting confirmation to Slack', { channelId });
    const confirmationMsg = createConfirmationMessage({
      incidentData,
      notionPageUrl: notionResult.url,
      notionPageId: notionResult.id,
    });

    const slackMessage = await slackApp.client.chat.postMessage({
      channel: channelId,
      ...confirmationMsg,
    });

    // Update Notion with Slack thread URL
    if (slackMessage.ts && slackMessage.channel) {
      // Build Slack thread URL - use generic format since team:read scope may not be available
      // Users can click the link and Slack will redirect to the correct workspace
      const slackThreadUrl = `https://slack.com/app_redirect?channel=${slackMessage.channel}&message_ts=${slackMessage.ts}`;

      await updateIncidentWithSlackThread({
        notionPageId: notionResult.id,
        slackThreadUrl,
        slackMessageTs: slackMessage.ts,
        slackChannelId: slackMessage.channel,
      });
    }

    logger.info('Incident created successfully', {
      notionPageId: notionResult.id,
      slackMessageTs: slackMessage.ts,
    });

  } catch (error) {
    logger.error('Failed to create incident', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Try to notify user about the error
    try {
      await client.chat.postMessage({
        channel: body.user.id,
        text: `Sorry, there was an error creating the incident: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } catch (notifyError) {
      logger.error('Failed to notify user about error', notifyError);
    }
  }
}
